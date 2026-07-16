import os
import uuid
from app.core.celery_app import celery_app
from app.core.data_loader import load_single_document
from app.db.database import get_db_connection
from app.core.search import RAGSearch

@celery_app.task(bind=True)
def process_document_task(self, temp_file_path: str, filename: str, user_id: str, file_size: int):
    try:
        print(f"[CELERY] Starting to process document: {filename} for user: {user_id}")
        
        # Load and parse the document
        documents = load_single_document(temp_file_path, filename)
        
        if documents:
            # We initialize a new RAGSearch instance so it handles its own Qdrant connection pool in this worker
            rag = RAGSearch()
            rag.vectorstore.add_documents(documents, filename, user_id)
            
        # Update PostgreSQL
        conn = get_db_connection()
        cursor = conn.cursor()
        doc_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO documents (id, user_id, filename, file_path, size) 
            VALUES (%s, %s, %s, %s, %s) 
            ON CONFLICT (user_id, filename) DO UPDATE SET size = EXCLUDED.size, uploaded_at = CURRENT_TIMESTAMP
            """,
            (doc_id, user_id, filename, "diskless", file_size)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"[CELERY] Successfully processed and indexed: {filename}")
        
    except Exception as e:
        print(f"[CELERY ERROR] Upload processing failed for {filename}: {e}")
        
    finally:
        # Cleanup the temporary file regardless of success or failure
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
    return {"message": "success", "filename": filename}
