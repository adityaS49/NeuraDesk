
from src.search import RAGSearch

# Example usage
if __name__ == "__main__":
    # Initialize RAGSearch which automatically detects any changes in the 'data/' folder
    # and rebuilds the vector store index only when necessary.
    rag_search = RAGSearch()
    