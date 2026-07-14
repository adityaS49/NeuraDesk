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
    <div className="w-full max-w-4xl flex flex-col h-full min-h-[calc(100vh-140px)] relative">
      <div className="flex-1 flex flex-col gap-6 pb-4 animate-fade-in-up">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 min-h-[40vh]">
            <div className="relative mb-6 mt-12">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-blob"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">How can I help you today?</h2>
            <p className="text-sm font-medium text-zinc-400">Ask questions about your uploaded documents.</p>
          </div>
        )}
        
        <div className="flex flex-col gap-6 px-2">
          {messages.map((msg, index) => (
            <div key={index} className={`flex w-full animate-fade-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 shadow-md shadow-indigo-500/20 shrink-0">
                  AI
                </div>
              )}
              <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm shadow-indigo-500/20" : "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50 rounded-tl-sm shadow-xl shadow-black/5"}`}>
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          
          {loadingChat && (
            <div className="flex justify-start items-end animate-fade-in-up">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-3 shadow-md shadow-indigo-500/20 shrink-0">
                AI
              </div>
              <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md shadow-xl shadow-black/5 border border-zinc-200 dark:border-zinc-700/50 rounded-3xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      
      <div className="w-full mt-auto pt-6 sticky bottom-0 pb-4 z-40 bg-zinc-50/80 dark:bg-[#050505]/80 backdrop-blur-xl border-t border-transparent relative">
        {/* Subtle fade effect to indicate more content below */}
        <div className="absolute top-0 left-0 w-full h-12 -mt-12 bg-gradient-to-t from-zinc-50/90 dark:from-[#050505]/90 to-transparent pointer-events-none"></div>
        <form onSubmit={handleChatSubmit} className="relative flex items-center shadow-2xl shadow-indigo-500/10 rounded-[2rem]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loadingChat}
            placeholder="Ask a question..."
            className="w-full glass-panel focus:bg-white dark:focus:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-[2rem] pl-8 pr-16 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 transition-all disabled:opacity-50 outline-none text-[15px] font-medium"
          />
          <button
            type="submit"
            disabled={loadingChat || !query.trim()}
            className="absolute right-3 p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:scale-105 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/30"
          >
            <svg className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
