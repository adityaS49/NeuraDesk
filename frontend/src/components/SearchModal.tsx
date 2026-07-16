"use client";
import { useState, useEffect } from "react";

interface SearchModalProps {
  onClose: () => void;
  documents: { filename: string; size: number }[];
}

export default function SearchModal({ onClose, documents }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [filenameFilter, setFilenameFilter] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-modal rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/20 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        
        {/* Header / Search Bar */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Semantic Search</h2>
              <p className="text-xs text-slate-400">Query your entire knowledge base</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner placeholder-slate-500 transition-all"
                autoFocus
              />
            </div>
            
            <div className="w-48 relative hidden sm:block">
              <select
                value={filenameFilter}
                onChange={(e) => setFilenameFilter(e.target.value)}
                className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer disabled:opacity-50 text-sm"
              >
                <option value="">All Contexts</option>
                {documents.map((doc) => (
                  <option key={doc.filename} value={doc.filename}>{doc.filename}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex-shrink-0"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/30">
          {loading && hasSearched && (
            <div className="flex justify-center py-12 animate-pulse">
              <div className="flex items-center gap-3 bg-slate-800/80 px-5 py-2.5 rounded-full border border-slate-700 shadow-sm">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-slate-300 font-medium text-sm ml-1">AI is thinking...</span>
              </div>
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 opacity-60">
              <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <p className="text-lg font-medium">Search across all your documents instantly.</p>
            </div>
          )}

          {results.length === 0 && !loading && hasSearched && (
            <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700 animate-fade-in-up">
              <svg className="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-slate-400 font-medium">No relevant information found.</p>
            </div>
          )}
          
          {answer && !loading && (
            <div className="mb-8 bg-indigo-900/10 rounded-2xl p-6 border border-indigo-500/20 shadow-sm animate-fade-in-up relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-indigo-300">AI Synthesized Answer</h3>
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-[15px] relative z-10 font-medium">
                {answer}
              </p>
            </div>
          )}
          
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4 opacity-50">
                <div className="h-px flex-1 bg-slate-700"></div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referenced Sources</h3>
                <div className="h-px flex-1 bg-slate-700"></div>
              </div>
              
              {results.map((res, i) => (
                <div key={i} className="group bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50 hover:border-indigo-500/30 hover:bg-slate-800/60 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${(i) * 50}ms` }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-md">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {res.filename || "Unknown Source"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      Match: {(res.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed group-hover:text-slate-300 transition-colors pl-1 border-l-2 border-slate-700 group-hover:border-indigo-500/50">
                    "... {res.text} ..."
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
