from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import jwt
from psycopg2.extras import RealDictCursor

from app.core.config import settings
from app.db.database import get_db_connection
from app.core.search import RAGSearch

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

rag_search_instance = None

def get_rag_search():
    global rag_search_instance
    if rag_search_instance is None:
        print("[INFO] Initializing RAGSearch (downloading models if first run)...")
        rag_search_instance = RAGSearch()
    return rag_search_instance

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
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
