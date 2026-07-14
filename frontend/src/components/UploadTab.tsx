"use client";
import { useState, useRef } from "react";

export default function UploadTab() {
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
    setUploadStatus("Uploading & Indexing...");

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
    <div className="w-full max-w-xl glass-panel rounded-3xl p-8 mt-12 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Upload Knowledge</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Feed your AI new documents to expand its context.</p>
      </div>

      <form onSubmit={handleUploadSubmit} className="flex flex-col gap-6">
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Document Type</label>
          <div className="relative">
            <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none outline-none transition-all cursor-pointer"
            >
              <option value="pdf">PDF Document</option>
              <option value="txt">Text File</option>
              <option value="csv">CSV/Excel</option>
              <option value="json">JSON Data</option>
              <option value="other">Other</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">File</label>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-105' 
                : file 
                  ? 'border-green-400 bg-green-50/30 dark:bg-green-900/10'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50'
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
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{file.name}</span>
                <span className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">Click to upload or drag and drop</span>
                <span className="text-xs text-zinc-400">PDF, TXT, CSV, JSON (MAX. 10MB)</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || isUploading}
          className="relative mt-2 w-full rounded-xl px-4 py-3.5 font-bold text-white transition-all overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:scale-105 transition-transform duration-300"></div>
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
          <div className={`mt-2 p-4 rounded-xl text-sm font-medium animate-fade-in-up flex items-center gap-2 ${uploadStatus.includes("Success") ? "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"}`}>
            {uploadStatus.includes("Success") && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            {uploadStatus}
          </div>
        )}
      </form>
    </div>
  );
}
