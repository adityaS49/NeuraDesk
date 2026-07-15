import { useState, useEffect } from "react";
import { Tab } from "./types";

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout?: () => void;
}

export default function Header({ activeTab, setActiveTab, onLogout }: HeaderProps) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "User");
  }, []);

  return (
    <header className="glass-panel py-4 px-6 sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
          N
        </div>
        <h1 className="text-xl font-bold text-blue-400 hidden sm:block">
          NeuraDesk
        </h1>
      </div>
      
      <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-full shadow-inner border border-zinc-700">
        {[
          { id: "chat", label: "Chat" },
          { id: "upload", label: "Upload" },
          { id: "manage", label: "Manage Docs" },
          { id: "search", label: "Search" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-out overflow-hidden
              ${activeTab === tab.id 
                ? "text-white shadow-sm" 
                : "text-zinc-400 hover:text-blue-400 hover:bg-zinc-700/50"
              }
            `}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-blue-600 rounded-full -z-10" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-medium">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-[10px] flex items-center justify-center text-white">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-zinc-300">{username}</span>
        </div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
            title="Log out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        )}
      </div>
    </header>
  );
}
