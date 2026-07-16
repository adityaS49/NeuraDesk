"use client";
import { useState, useRef } from "react";

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("pdf");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleUploadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Queuing document for background processing...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setUploadStatus(`Success: ${data.message}`);
      setFile(null);
      
      // Call the success callback to poll/refresh documents list
      onUploadSuccess();
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setUploadStatus("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div className="relative w-full max-w-lg glass-modal rounded-3xl p-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Upload Knowledge</h2>
          <p className="text-sm text-slate-400 mt-2">Feed your AI new documents to expand its context.</p>
        </div>

        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Document Type</label>
            <div className="relative">
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none outline-none transition-all cursor-pointer shadow-sm"
              >
                <option value="pdf">PDF Document</option>
                <option value="txt">Text File</option>
                <option value="csv">CSV/Excel</option>
                <option value="json">JSON Data</option>
                <option value="other">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">File</label>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                ${isDragging 
                  ? 'border-indigo-500 bg-indigo-900/20 scale-[1.02]' 
                  : file 
                    ? 'border-emerald-500/50 bg-emerald-900/10'
                    : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50'
                }
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="font-semibold text-slate-200">{file.name}</span>
                  <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-1 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="font-medium text-slate-300">Click to upload or drag and drop</span>
                  <span className="text-xs text-slate-500">PDF, TXT, CSV, JSON (MAX. 10MB)</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || isUploading}
            className="relative mt-2 w-full rounded-xl px-4 py-3.5 font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
          >
            <span className="relative flex items-center justify-center gap-2">
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                "Upload & Index"
              )}
            </span>
          </button>

          {uploadStatus && (
            <div className={`mt-2 p-4 rounded-xl text-sm font-medium animate-fade-in-up flex items-center gap-3 ${uploadStatus.includes("Success") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-slate-800/50 text-slate-300 border border-slate-700"}`}>
              {uploadStatus.includes("Success") && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
              {uploadStatus}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
