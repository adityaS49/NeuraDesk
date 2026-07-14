import os
import numpy as np
import uuid
from typing import List, Any
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from .embedding import EmbeddingPipeline
from .data_loader import load_all_documents

class QdrantVectorStore:
    def __init__(self, collection_name: str = "documents", embedding_model: str = "all-MiniLM-L6-v2", chunk_size: int = 1000, chunk_overlap: int = 200):
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.client = QdrantClient(url=qdrant_url)
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.model = SentenceTransformer(embedding_model)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # We assume embedding model produces 384 dimensions for all-MiniLM-L6-v2
        self.dim = self.model.get_sentence_embedding_dimension()
        
        # Ensure collection exists
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=qmodels.VectorParams(size=self.dim, distance=qmodels.Distance.COSINE),
            )
        print(f"[INFO] Loaded Qdrant collection '{collection_name}' with embedding model: {embedding_model}")

    def add_documents(self, documents: List[Any], source_filename: str):
        if not documents:
            print(f"[WARNING] No documents to add for {source_filename}.")
            return
            
        print(f"[INFO] Adding {len(documents)} document pages/chunks for {source_filename} to vector store...")
        
        emb_pipe = EmbeddingPipeline(model_name=self.embedding_model, chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        chunks = emb_pipe.chunk_documents(documents)
        if not chunks:
            print(f"[WARNING] No chunks created for {source_filename}.")
            return
            
        embeddings = emb_pipe.embed_chunks(chunks)
        metadatas = [{"text": chunk.page_content, "source": source_filename} for chunk in chunks]
        
        points = []
        for i, (emb, meta) in enumerate(zip(embeddings, metadatas)):
            points.append(qmodels.PointStruct(
                id=str(uuid.uuid4()),
                vector=emb.tolist(),
                payload=meta
            ))
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        print(f"[INFO] Upserted {len(points)} vectors to Qdrant collection '{self.collection_name}' for {source_filename}.")

    def search(self, query_embedding: np.ndarray, top_k: int = 5, filter_source: str = None):
        try:
            query_filter = None
            if filter_source:
                query_filter = qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="source",
                            match=qmodels.MatchValue(value=filter_source)
                        )
                    ]
                )
            
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_embedding.tolist(),
                query_filter=query_filter,
                limit=top_k
            ).points
            return results
        except Exception as e:
            print(f"[ERROR] Qdrant search failed: {e}")
            return []

    def query(self, query_text: str, top_k: int = 5, filter_source: str = None):
        print(f"[INFO] Querying vector store for: '{query_text}'" + (f" (filtered by {filter_source})" if filter_source else ""))
        query_emb = self.model.encode([query_text])[0]
        
        vector_results = self.search(query_emb, top_k=top_k, filter_source=filter_source)
        
        combined_results = []
        for res in vector_results:
            combined_results.append({
                "id": res.id,
                "score": res.score,
                "metadata": res.payload
            })
            
        return combined_results

    def delete_by_source(self, source_filename: str):
        print(f"[INFO] Deleting vectors for source: {source_filename}")
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[
                            qmodels.FieldCondition(
                                key="source",
                                match=qmodels.MatchValue(value=source_filename)
                            )
                        ]
                    )
                )
            )
        except Exception as e:
            print(f"[ERROR] Failed to delete vectors for {source_filename}: {e}")

