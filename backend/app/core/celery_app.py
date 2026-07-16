import os
from celery import Celery

from app.core.config import settings
redis_url = settings.REDIS_URL or "redis://localhost:6379/0"

celery_app = Celery(
    "python-rag-worker",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.document_tasks"]
)


