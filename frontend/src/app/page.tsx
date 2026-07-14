"use client";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import ChatTab from "../components/ChatTab";
import UploadTab from "../components/UploadTab";
import ManageTab from "../components/ManageTab";
import SearchTab from "../components/SearchTab";
import AuthScreen from "../components/AuthScreen";
import { Tab } from "../components/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (token: string, username: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
  };

  if (isChecking) {
    return <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#050505] text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="relative flex flex-col h-screen font-sans overflow-hidden bg-zinc-50 dark:bg-[#050505]">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-400/20 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-400/20 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Glassmorphic Layer */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          {activeTab === "chat" && <ChatTab />}
          {activeTab === "upload" && <UploadTab />}
          {activeTab === "manage" && <ManageTab />}
          {activeTab === "search" && <SearchTab />}
        </main>
      </div>
    </div>
  );
}
