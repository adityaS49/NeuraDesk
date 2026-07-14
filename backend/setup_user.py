import psycopg2

def setup_custom_user():
    print("Connecting as superuser (postgres)...")
    try:
        # Connect to the default database to create users
        conn = psycopg2.connect("postgresql://postgres:password@localhost:5435/postgres")
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname='pythonRag'")
        exists = cursor.fetchone()
        
        if not exists:
            print("Creating user 'pythonRag'...")
            cursor.execute("CREATE USER \"pythonRag\" WITH PASSWORD 'aditya9916A';")
        else:
            print("User 'pythonRag' already exists, updating password...")
            cursor.execute("ALTER USER \"pythonRag\" WITH PASSWORD 'aditya9916A';")
            
        print("Granting privileges on rag_memory database...")
        cursor.execute("GRANT ALL PRIVILEGES ON DATABASE rag_memory TO \"pythonRag\";")
        
        conn.close()
        print("Custom user setup successful!")
        
    except Exception as e:
        print(f"FAILED to setup user: {e}")

if __name__ == "__main__":
    setup_custom_user()
