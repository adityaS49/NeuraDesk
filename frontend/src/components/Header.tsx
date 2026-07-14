import { Tab } from "./types";

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="glass-panel border-b-0 shadow-sm p-4 sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center px-8 transition-all duration-300 rounded-b-3xl">
      <div className="flex items-center gap-3 mb-4 md:mb-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white font-bold">
          N
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          NeuraDesk
        </h1>
      </div>
      
      <div className="flex gap-1 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-md p-1 rounded-full shadow-inner border border-white/20 dark:border-zinc-700/30">
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
                ? "text-white shadow-lg" 
                : "text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/20 dark:hover:bg-zinc-700/30"
              }
            `}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full -z-10" />
            )}
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
