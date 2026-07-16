import os
import requests

API_URL = "http://127.0.0.1:8000"

# Register a test user
register_res = requests.post(f"{API_URL}/api/register", json={"username": "test_upload_user", "password": "password"})
print("Register:", register_res.status_code)

# Login
login_res = requests.post(f"{API_URL}/api/login", data={"username": "test_upload_user", "password": "password"})
print("Login:", login_res.status_code)
if login_res.status_code == 200:
    token = login_res.json()["access_token"]
    print("Got token")
else:
    print("Failed to login", login_res.text)
    exit(1)

# Upload a small file
headers = {"Authorization": f"Bearer {token}"}
with open("test.txt", "w") as f:
    f.write("hello world")

with open("test.txt", "rb") as f:
    files = {"file": ("test.txt", f, "text/plain")}
    data = {"document_type": "txt"}
    upload_res = requests.post(f"{API_URL}/api/upload", headers=headers, files=files, data=data)

print("Upload:", upload_res.status_code, upload_res.text)
