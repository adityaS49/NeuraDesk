from fastapi import APIRouter, Depends
from app.models.schemas import ChatRequest, ChatResponse
from app.api.dependencies import get_current_user, get_rag_search

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    answer = get_rag_search().search_and_summarize(
        request.query, 
        session_id=request.session_id, 
        top_k=3,
        filename_filter=request.filename_filter,
        user_id=str(current_user["id"]),
        username=current_user["username"]
    )
    return ChatResponse(answer=answer)
