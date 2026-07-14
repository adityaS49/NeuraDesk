import os
import sys
from dotenv import load_dotenv
import psycopg2

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Attempting to connect to: {db_url}")
try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print("Connection successful! Connected to: ", record[0])
    conn.close()
except (Exception, psycopg2.Error) as error:
    print("Error while connecting to PostgreSQL:", error)
    sys.exit(1)
