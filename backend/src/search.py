import os
from typing import Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv

from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

from .vectorstore import QdrantVectorStore

load_dotenv()

class State(TypedDict):
    messages: Annotated[list, add_messages]
    context: str
    username: str

class RAGSearch:
    def __init__(self, collection_name: str = "documents", embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2", llm_model: str = "llama-3.3-70b-versatile"):
        self.vectorstore = QdrantVectorStore(collection_name, embedding_model)
        
        # We rely on the unified search ingestion API to add documents incrementally
        # No initial directory loading is performed.
            
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key or groq_api_key.strip() == "" or groq_api_key == "your_groq_api_key_here":
            raise ValueError(
                "\n[ERROR] GROQ_API_KEY is not configured. Please set your actual Groq API key in the '.env' file in the project root."
            )
        self.llm = ChatGroq(groq_api_key=groq_api_key, model_name=llm_model)
        
        self.db_url = os.getenv("DATABASE_URL", "postgresql://python_rag_user:rag_password@127.0.0.1:5435/rag_memory")
        
        # PostgresSaver needs a connection pool (synchronous for PostgresSaver)
        self.pool = ConnectionPool(
            conninfo=self.db_url,
            max_size=20,
            kwargs={"autocommit": True}
        )
        
        # Setup Checkpointer
        self.checkpointer = PostgresSaver(self.pool)
        self.checkpointer.setup()

        # Build Graph
        workflow = StateGraph(State)
        
        def call_model(state: State):
            context = state.get("context", "")
            username = state.get("username", "User")
            system_prompt = f"You are a helpful AI assistant. You are speaking with {username}. Use the following context to answer their question:\n\n{context}\n\nIf the answer isn't in the context, just say you don't know."
            
            # Combine system prompt with existing messages
            messages_for_llm = [{"role": "system", "content": system_prompt}] + state["messages"]
            response = self.llm.invoke(messages_for_llm)
            return {"messages": [response]}
            
        workflow.add_node("agent", call_model)
        workflow.add_edge(START, "agent")
        workflow.add_edge("agent", END)
        
        self.graph = workflow.compile(checkpointer=self.checkpointer)
        print(f"[INFO] Groq LLM initialized with LangGraph Postgres Checkpointer: {llm_model}")

    def search_and_summarize(self, query: str, user_id: str, username: str, session_id: str = "default", top_k: int = 5, filename_filter: str = None) -> str:
        try:
            results = self.vectorstore.query(query, user_id=user_id, top_k=top_k, filter_source=filename_filter)
            texts = [r["metadata"].get("text", "") for r in results if r["metadata"]]
            context = "\n\n".join(texts)
        except Exception as e:
            print(f"[ERROR] Vectorstore search failed: {e}")
            context = ""
            
        if not context:
            context = "No relevant documents found."
            
        try:
            config = {"configurable": {"thread_id": f"{user_id}_{session_id}"}}
            input_message = HumanMessage(content=query)
            
            # Run the LangGraph
            state = self.graph.invoke({"messages": [input_message], "context": context, "username": username}, config)
            
            # The last message in the state is the AI's response
            return state["messages"][-1].content
        except Exception as e:
            print(f"[ERROR] LangGraph failed: {e}")
            return "Sorry, I encountered an error processing your request."
