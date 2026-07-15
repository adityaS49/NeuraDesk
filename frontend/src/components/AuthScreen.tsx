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
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);
        
        const res = await fetch("http://localhost:8000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
        
        if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
        
        const data = await res.json();
        onLogin(data.access_token, data.username);
      } else {
        const res = await fetch("http://localhost:8000/api/register", {
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
    <div className="relative flex items-center justify-center h-screen bg-zinc-900 overflow-hidden">
      <div className="z-10 w-full max-w-md p-8 m-4 rounded-2xl glass-panel shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
          NeuraDesk
        </h2>
        <div className="flex gap-4 mb-6 p-1 bg-white/5 rounded-xl">
          <button 
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${isLogin ? 'bg-zinc-800 shadow-sm text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${!isLogin ? 'bg-zinc-800 shadow-sm text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {error && (
          <div className={`p-3 mb-4 rounded-xl text-sm ${error.includes('successful') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 placeholder-zinc-500 shadow-sm"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 placeholder-zinc-500 shadow-sm"
              placeholder="Enter your password"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
