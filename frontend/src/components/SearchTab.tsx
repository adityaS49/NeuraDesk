"use client";
import { useState, useEffect } from "react";

export default function SearchTab() {
  const [query, setQuery] = useState("");
  const [filenameFilter, setFilenameFilter] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [documents, setDocuments] = useState<{ filename: string; size: number }[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
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
    fetchDocuments();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
            query, 
            filename_filter: filenameFilter.trim() ? filenameFilter : null,
            top_k: 5
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setAnswer(data.answer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl glass-panel rounded-3xl p-8 mt-12 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-400">Deep Search</h2>
        <p className="text-sm text-zinc-400 mt-2">Query across all documents or filter by a specific source.</p>
      </div>
      
      <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-10">
        <div className="flex gap-4 flex-wrap md:flex-nowrap relative z-20">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          <div className="w-full md:w-1/3 relative">
            <select
              value={filenameFilter}
              onChange={(e) => setFilenameFilter(e.target.value)}
              disabled={isLoadingDocs}
              className="w-full h-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <option value="">{isLoadingDocs ? "Loading docs..." : "All Contexts"}</option>
              {documents.map((doc) => (
                <option key={doc.filename} value={doc.filename}>
                  {doc.filename}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      <div className="space-y-6 relative z-10">
        {loading && hasSearched && (
          <div className="flex justify-center py-12 animate-fade-in-up">
            <div className="flex gap-2 items-center bg-zinc-800 px-6 py-3 rounded-full border border-zinc-700 shadow-sm">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-2 text-zinc-300 font-medium text-sm">AI is thinking...</span>
            </div>
          </div>
        )}

        {results.length === 0 && !loading && hasSearched && (
          <div className="text-center py-12 bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-700 animate-fade-in-up">
            <svg className="w-10 h-10 text-zinc-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-zinc-500 font-medium">No relevant information found.</p>
          </div>
        )}
        
        {answer && !loading && (
          <div className="bg-blue-900/10 rounded-2xl p-6 border border-blue-900/30 shadow-sm animate-fade-in-up relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-blue-400">AI Synthesized Answer</h3>
            </div>
            <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap text-[15px] relative z-10 font-medium">
              {answer}
            </p>
          </div>
        )}
        
        {!loading && results.length > 0 && (
          <div className="pt-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-zinc-700"></div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Referenced Sources</h3>
              <div className="h-px flex-1 bg-zinc-700"></div>
            </div>
          </div>
        )}
        
        {results.map((res, i) => (
          <div key={i} className="group bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700 hover:border-blue-700 hover:shadow-sm transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${(i + 2) * 50}ms` }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-lg mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {res.filename || "Unknown Source"}
                </span>
                <div className="text-[11px] text-zinc-400 font-medium flex gap-3">
                  {res.size && <span>{(res.size / 1024).toFixed(1)} KB</span>}
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">Match: {(res.score * 100).toFixed(0)}%</span>
            </div>
            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed group-hover:text-zinc-300 transition-colors">
              "... {res.text} ..."
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
