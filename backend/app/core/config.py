import os
from dotenv import load_dotenv

# Define the base directory of the backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env first (default/external config)
load_dotenv(os.path.join(BASE_DIR, ".env"))
# Then load .env.local, overriding any existing variables (local overrides)
load_dotenv(os.path.join(BASE_DIR, ".env.local"), override=True)

class Settings:
    PROJECT_NAME: str = "Python-RAG"
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    _expire = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(_expire) if _expire else 10080
    
    QDRANT_URL: str = os.getenv("QDRANT_URL")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    REDIS_URL: str = os.getenv("REDIS_URL")

settings = Settings()
