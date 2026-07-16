import os
import sys

# Ensure we're hitting the correct backend
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
import jwt

print(f"JWT_SECRET from settings: {settings.JWT_SECRET}")
print(f"JWT_ALGORITHM from settings: {settings.JWT_ALGORITHM}")
print(f"Expire minutes: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")

from datetime import datetime, timedelta
to_encode = {"sub": "testuser"}
expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
to_encode.update({"exp": expire})
try:
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    print("Encoded JWT:", encoded_jwt)
    
    decoded = jwt.decode(encoded_jwt, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    print("Decoded JWT:", decoded)
except Exception as e:
    print("Error:", repr(e))
