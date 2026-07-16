"use client";
import { useState } from "react";

interface AuthScreenProps {
  onLogin: (token: string, username: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);
        
        const res = await fetch(`${API_BASE}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
        
        if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
        
        const data = await res.json();
        onLogin(data.access_token, data.username);
      } else {
        const res = await fetch(`${API_BASE}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        
        if (!res.ok) throw new Error((await res.json()).detail || "Registration failed");
        
        // Auto-login after successful registration
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-slate-950 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-md p-8 m-4 rounded-3xl glass-modal shadow-2xl shadow-indigo-900/10 border border-slate-800 animate-fade-in-up">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            NeuraDesk
          </h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Your intelligent knowledge assistant</p>
        </div>

        <div className="flex gap-2 mb-8 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-inner">
          <button 
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300 ${isLogin ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300 ${!isLogin ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium animate-fade-in-up flex items-center gap-2 ${error.includes('successful') ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/50' : 'bg-red-900/20 text-red-400 border border-red-800/50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={error.includes('successful') ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder-slate-600 transition-all shadow-inner"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-100 placeholder-slate-600 transition-all shadow-inner"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !username || !password}
            className="relative w-full py-4 mt-2 rounded-xl font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
          >
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                isLogin ? "Sign In to Workspace" : "Create Workspace"
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
