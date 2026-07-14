from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import os
import shutil
import uuid
import tempfile
from typing import Optional
from dotenv import load_dotenv
from datetime import datetime, timedelta
import jwt
import bcrypt

import psycopg2
from psycopg2.extras import RealDictCursor

from src.search import RAGSearch
from src.data_loader import load_single_document

load_dotenv()

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_search = RAGSearch()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://python_rag_user:rag_password@127.0.0.1:5435/rag_memory")
    return psycopg2.connect(db_url)

@app.on_event("startup")
def startup_event():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # We don't wipe tables anymore to preserve users across reloads
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                size INTEGER NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, filename)
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        
        # Ensure collection exists without deleting it
        try:
            rag_search.vectorstore.client.get_collection(rag_search.vectorstore.collection_name)
        except Exception:
            from qdrant_client.http import models as qmodels
            rag_search.vectorstore.client.create_collection(
                collection_name=rag_search.vectorstore.collection_name,
                vectors_config=qmodels.VectorParams(size=rag_search.vectorstore.dim, distance=qmodels.Distance.COSINE)
            )
        print("[INFO] Verified Postgres tables and Qdrant collection for multi-tenancy.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize DB schemas: {e}")

# AUTHENTICATION

def verify_password(plain_password: str, hashed_password: str):
    password_bytes = plain_password[:72].encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)

def get_password_hash(password: str):
    password_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, username FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if user is None:
        raise credentials_exception
    return user

class UserCreate(BaseModel):
    username: str
    password: str

@app.post("/api/register")
def register(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already registered")
            
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user.password)
        cursor.execute("INSERT INTO users (id, username, password_hash) VALUES (%s, %s, %s)", 
                       (user_id, user.username, hashed_password))
        conn.commit()
    except Exception as e:
        conn.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
        
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, username, password_hash FROM users WHERE username = %s", (form_data.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": str(user["id"])}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "username": user["username"]}


# PROTECTED ENDPOINTS

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"
    filename_filter: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    answer = rag_search.search_and_summarize(
        request.query, 
        session_id=request.session_id, 
        top_k=3,
        filename_filter=request.filename_filter,
        user_id=str(current_user["id"]),
        username=current_user["username"]
    )
    return ChatResponse(answer=answer)

@app.post("/api/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), document_type: str = Form(...), current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    ext = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        temp_file_path = temp_file.name
        try:
            shutil.copyfileobj(file.file, temp_file)
        except Exception as e:
            os.remove(temp_file_path)
            raise HTTPException(status_code=500, detail=str(e))
            
    file_size = os.path.getsize(temp_file_path)
    
    try:
        documents = load_single_document(temp_file_path, file.filename)
        
        if documents:
            rag_search.vectorstore.add_documents(documents, file.filename, user_id)
            
        conn = get_db_connection()
        cursor = conn.cursor()
        doc_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO documents (id, user_id, filename, file_path, size) 
            VALUES (%s, %s, %s, %s, %s) 
            ON CONFLICT (user_id, filename) DO UPDATE SET size = EXCLUDED.size, uploaded_at = CURRENT_TIMESTAMP
            """,
            (doc_id, user_id, file.filename, "diskless", file_size)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Upload processing failed: {e}")
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")
        
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
    
    return {"message": f"Successfully uploaded and indexed {file.filename}", "filename": file.filename}

@app.get("/api/documents")
async def list_documents(current_user: dict = Depends(get_current_user)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT filename, size, uploaded_at FROM documents WHERE user_id = %s ORDER BY uploaded_at DESC", (str(current_user["id"]),))
        docs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        for d in docs:
            d["uploaded_at"] = str(d["uploaded_at"])
            
        return {"documents": docs}
    except Exception as e:
        print(f"[ERROR] DB Select failed: {e}")
        return {"documents": []}

@app.delete("/api/documents/{filename}")
async def delete_document(filename: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE user_id = %s AND filename = %s", (user_id, filename))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[ERROR] DB Delete failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete from database")

    rag_search.vectorstore.delete_by_source(filename, user_id)
        
    return {"message": f"Successfully deleted {filename}"}

class SearchRequest(BaseModel):
    query: str
    filename_filter: Optional[str] = None
    top_k: int = 5

@app.post("/api/search")
async def unified_search(request: SearchRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    vector_results = rag_search.vectorstore.query(
        request.query, 
        top_k=request.top_k, 
        filter_source=request.filename_filter,
        user_id=user_id
    )
    
    if not vector_results:
        return {"results": []}
        
    filenames = list(set([res["metadata"].get("source") for res in vector_results if res.get("metadata") and res["metadata"].get("source")]))
    
    db_metadata = {}
    if filenames:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT filename, size, uploaded_at FROM documents WHERE user_id = %s AND filename IN %s"
            cursor.execute(query, (user_id, tuple(filenames),))
            records = cursor.fetchall()
            for r in records:
                db_metadata[r["filename"]] = {
                    "size": r["size"],
                    "uploaded_at": str(r["uploaded_at"])
                }
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"[ERROR] DB Select failed during search: {e}")

    final_results = []
    for res in vector_results:
        source = res["metadata"].get("source", "")
        item = {
            "id": res["id"],
            "score": res["score"],
            "text": res["metadata"].get("text", ""),
            "filename": source
        }
        if source in db_metadata:
            item.update(db_metadata[source])
        final_results.append(item)
        
    texts = [res["text"] for res in final_results if res.get("text")]
    context = "\n\n".join(texts)
    try:
        from langchain_core.messages import HumanMessage
        config = {"configurable": {"thread_id": f"search_tab_{user_id}_{uuid.uuid4()}"}}
        input_message = HumanMessage(content=request.query)
        # Assuming search.py is modified to pass username to the graph state if supported, or we just rely on rag_search logic
        state = rag_search.graph.invoke({"messages": [input_message], "context": context, "username": current_user["username"]}, config)
        answer = state["messages"][-1].content
    except Exception as e:
        print(f"[ERROR] LLM synthesis failed in search: {e}")
        answer = "Sorry, I could not synthesize an answer from the documents at this time."
        
    return {"results": final_results, "answer": answer}
