"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatTab() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [query, setQuery] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user" as const, content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoadingChat(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ query: userMessage.content, session_id: "user-session-1" }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "ai", content: "Error connecting to backend." }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative px-4 sm:px-8">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-8 pr-2 flex flex-col gap-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-tight">How can I help you today?</h2>
            <p className="text-slate-400">Ask questions about your uploaded documents.</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`flex w-full animate-fade-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold mr-4 mt-1 shadow-md shadow-indigo-500/20 shrink-0">
                AI
              </div>
            )}
            <div className={`max-w-[85%] rounded-3xl px-6 py-4 ${
              msg.role === "user" 
                ? "bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-900/20" 
                : "bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-sm shadow-sm"
              }`}
            >
              <div className="text-[15px] whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</div>
            </div>
          </div>
        ))}
        
        {loadingChat && (
          <div className="flex justify-start items-end animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold mr-4 shadow-md shadow-indigo-500/20 shrink-0">
              AI
            </div>
            <div className="bg-slate-800/80 shadow-sm border border-slate-700/50 rounded-3xl rounded-tl-sm px-6 py-5 flex gap-1.5 items-center">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
      
      {/* Input Area */}
      <div className="w-full pb-6 pt-2 sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md">
        {/* Subtle fade effect to indicate more content below */}
        <div className="absolute top-0 left-0 w-full h-12 -mt-12 bg-gradient-to-t from-slate-900/95 to-transparent pointer-events-none"></div>
        
        <form onSubmit={handleChatSubmit} className="relative flex items-center group shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loadingChat}
            placeholder="Message NeuraDesk..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl pl-6 pr-16 py-4 text-slate-100 placeholder-slate-500 transition-all disabled:opacity-50 outline-none text-[15px]"
          />
          <button
            type="submit"
            disabled={loadingChat || !query.trim()}
            className="absolute right-3 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl hover:scale-105 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <svg className="w-5 h-5 translate-x-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
        <div className="text-center mt-3">
          <span className="text-[11px] text-slate-500 font-medium">NeuraDesk can make mistakes. Verify important information.</span>
        </div>
      </div>
    </div>
  );
}
