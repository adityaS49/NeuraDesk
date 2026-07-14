from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import uuid
import tempfile
from typing import Optional
from dotenv import load_dotenv

import psycopg2
from psycopg2.extras import RealDictCursor

from src.search import RAGSearch
from src.data_loader import load_single_document

load_dotenv()

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
    # Initialize Postgres table
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                size INTEGER NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("[INFO] Postgres documents table initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize documents table: {e}")

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"
    filename_filter: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    answer = rag_search.search_and_summarize(
        request.query, 
        session_id=request.session_id, 
        top_k=3,
        filename_filter=request.filename_filter
    )
    return ChatResponse(answer=answer)

@app.post("/api/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), document_type: str = Form(...)):
    # Create an ephemeral temporary file to hold the upload
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
        # Load and parse the document using data_loader
        documents = load_single_document(temp_file_path, file.filename)
        
        # Incrementally add chunks to Qdrant without a full index rebuild
        if documents:
            rag_search.vectorstore.add_documents(documents, file.filename)
            
        # Insert metadata into Postgres (setting file_path to 'diskless')
        conn = get_db_connection()
        cursor = conn.cursor()
        doc_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO documents (id, filename, file_path, size) 
            VALUES (%s, %s, %s, %s) 
            ON CONFLICT (filename) DO UPDATE SET size = EXCLUDED.size, uploaded_at = CURRENT_TIMESTAMP
            """,
            (doc_id, file.filename, "diskless", file_size)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Upload processing failed: {e}")
        # Clean up the temp file if it fails
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")
        
    finally:
        # Clean up the temporary file immediately (diskless architecture)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
    
    return {"message": f"Successfully uploaded and indexed {file.filename}", "filename": file.filename}

@app.get("/api/documents")
async def list_documents():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT filename, size, uploaded_at FROM documents ORDER BY uploaded_at DESC")
        docs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert datetime to string
        for d in docs:
            d["uploaded_at"] = str(d["uploaded_at"])
            
        return {"documents": docs}
    except Exception as e:
        print(f"[ERROR] DB Select failed: {e}")
        return {"documents": []}

@app.delete("/api/documents/{filename}")
async def delete_document(filename: str):
    # Delete from Postgres
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE filename = %s", (filename,))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[ERROR] DB Delete failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete from database")

    # Explicitly delete vectors from Qdrant
    rag_search.vectorstore.delete_by_source(filename)
        
    return {"message": f"Successfully deleted {filename}"}

class SearchRequest(BaseModel):
    query: str
    filename_filter: Optional[str] = None
    top_k: int = 5

@app.post("/api/search")
async def unified_search(request: SearchRequest):
    # 1. Query Qdrant for semantic matches
    vector_results = rag_search.vectorstore.query(
        request.query, 
        top_k=request.top_k, 
        filter_source=request.filename_filter
    )
    
    if not vector_results:
        return {"results": []}
        
    # 2. Extract unique filenames from vector results
    filenames = list(set([res["metadata"].get("source") for res in vector_results if res.get("metadata") and res["metadata"].get("source")]))
    
    # 3. Fetch metadata from Postgres for those filenames
    db_metadata = {}
    if filenames:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT filename, size, uploaded_at FROM documents WHERE filename IN %s"
            cursor.execute(query, (tuple(filenames),))
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

    # 4. Combine results
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
        
    # 5. Synthesize an accurate answer using the LLM
    texts = [res["text"] for res in final_results if res.get("text")]
    context = "\n\n".join(texts)
    try:
        from langchain_core.messages import HumanMessage
        config = {"configurable": {"thread_id": "search_tab_" + str(uuid.uuid4())}}
        input_message = HumanMessage(content=request.query)
        state = rag_search.graph.invoke({"messages": [input_message], "context": context}, config)
        answer = state["messages"][-1].content
    except Exception as e:
        print(f"[ERROR] LLM synthesis failed in search: {e}")
        answer = "Sorry, I could not synthesize an answer from the documents at this time."
        
    return {"results": final_results, "answer": answer}
