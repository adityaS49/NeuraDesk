import os
import tempfile
import shutil
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from psycopg2.extras import RealDictCursor

from app.api.dependencies import get_current_user, get_rag_search
from app.db.database import get_db_connection
from app.tasks.document_tasks import process_document_task

router = APIRouter()

@router.post("/upload")
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
    
    # Dispatch Celery background task
    process_document_task.delay(temp_file_path, file.filename, user_id, file_size)
    
    return {"message": f"Successfully queued {file.filename} for processing", "filename": file.filename}

@router.get("/documents")
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

@router.delete("/documents/{filename}")
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

    get_rag_search().vectorstore.delete_by_source(filename, user_id)
        
    return {"message": f"Successfully deleted {filename}"}
