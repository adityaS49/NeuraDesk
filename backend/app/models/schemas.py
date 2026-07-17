from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UrlUploadRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"
    filename_filter: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str

class SearchRequest(BaseModel):
    query: str
    filename_filter: Optional[str] = None
    top_k: int = 5
