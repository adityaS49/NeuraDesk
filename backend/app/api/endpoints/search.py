import uuid
from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor

from app.models.schemas import SearchRequest
from app.api.dependencies import get_current_user, get_rag_search
from app.db.database import get_db_connection

router = APIRouter()

@router.post("/search")
async def unified_search(request: SearchRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    vector_results = get_rag_search().vectorstore.query(
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
        state = get_rag_search().graph.invoke({"messages": [input_message], "context": context, "username": current_user["username"]}, config)
        answer = state["messages"][-1].content
    except Exception as e:
        print(f"[ERROR] LLM synthesis failed in search: {e}")
        answer = "Sorry, I could not synthesize an answer from the documents at this time."
        
    return {"results": final_results, "answer": answer}
