"use client";
import { useState, useEffect } from "react";

export default function ManageTab() {
  const [documents, setDocuments] = useState<{ filename: string; size: number }[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/documents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (filename: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/documents/${filename}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="w-full max-w-3xl glass-panel rounded-3xl p-8 mt-12 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Knowledge Base</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage documents available to the AI.</p>
        </div>
        <button 
          onClick={fetchDocuments} 
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-105"
          title="Refresh List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>
      
      {isLoadingDocs ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-500 font-medium">Loading knowledge base...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
          <svg className="w-12 h-12 text-zinc-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg">No documents found</p>
          <p className="text-sm text-zinc-500 mt-1">Head to the Upload tab to add some knowledge.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc, i) => (
            <div 
              key={doc.filename} 
              className="group flex justify-between items-center bg-white/50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.filename}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Indexed • {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(doc.filename)}
                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete Document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
