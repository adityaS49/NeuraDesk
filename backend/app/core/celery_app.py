import os
from celery import Celery

from app.core.config import settings
redis_url = settings.REDIS_URL or "redis://localhost:6379/0"

if redis_url.startswith("rediss://") and "ssl_cert_reqs" not in redis_url:
    separator = "&" if "?" in redis_url else "?"
    redis_url += f"{separator}ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    "python-rag-worker",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.document_tasks"]
)


