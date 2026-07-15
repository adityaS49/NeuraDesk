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
    return <div className="h-screen flex items-center justify-center bg-zinc-900 text-zinc-100">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="relative flex flex-col h-screen font-sans overflow-hidden bg-zinc-900 text-zinc-100">
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
