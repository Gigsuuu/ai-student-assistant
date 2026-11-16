"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  BookOpen,
  Sparkles,
  AlertCircle,
  Loader2,
  FileCheck,
  Hash,
  Clock,
} from "lucide-react";
import { SAMPLE_CE_NOTES } from "@/lib/sampleNotes";

interface StudyInputPanelProps {
  studyText: string;
  setStudyText: (text: string) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
  onClear: () => void;
}

export function StudyInputPanel({
  studyText,
  setStudyText,
  fileName,
  setFileName,
  onClear,
}: StudyInputPanelProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate live statistics
  const trimmed = studyText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = studyText.length;
  // Average reading speed: ~200 words per minute
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 200));

  /**
   * Handles text file parsing client-side via FileReader
   */
  const handleTextFile = (file: File) => {
    setIsLoadingFile(true);
    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      setStudyText(content || "");
      setFileName(file.name);
      setPdfPages(null);
      setIsLoadingFile(false);
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read text file. Please try again.");
      setIsLoadingFile(false);
    };

    reader.readAsText(file);
  };

  /**
   * Handles PDF file parsing by posting to server route /api/parse-pdf
   */
  const handlePdfFile = async (file: File) => {
    setIsLoadingFile(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse PDF document.");
      }

      setStudyText(data.text);
      setFileName(file.name);
      setPdfPages(data.numPages || null);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to process PDF.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  /**
   * Processes selected or dropped file (.txt or .pdf)
   */
  const processFile = (file: File) => {
    setErrorMessage(null);
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "txt") {
      handleTextFile(file);
    } else if (extension === "pdf") {
      handlePdfFile(file);
    } else {
      setErrorMessage("Unsupported file format. Please upload a .txt or .pdf file.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setStudyText(SAMPLE_CE_NOTES);
    setFileName("Lecture14_VirtualMemory_Paging.txt");
    setPdfPages(null);
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    onClear();
    setPdfPages(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Bar with Mode Switcher & Actions */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("paste")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "paste"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Demo Sample Loader Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            type="button"
            title="Load ready-to-test Computer Engineering lecture notes"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Load CE Sample</span>
          </button>

          {trimmed.length > 0 && (
            <button
              onClick={handleClearAll}
              type="button"
              title="Clear study material"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Material Input Area */}
      <div className="p-4 flex-1 flex flex-col gap-3 min-h-[360px]">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Document Notice</p>
              <p className="text-rose-300/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Active Tab View */}
        {activeTab === "upload" ? (
          <div className="flex-1 flex flex-col gap-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-400 bg-indigo-500/10 scale-[0.99]"
                  : "border-slate-700/80 hover:border-slate-600 bg-slate-950/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,application/pdf,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />

              {isLoadingFile ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm font-medium text-slate-300">
                    Extracting study material from document...
                  </p>
                  <p className="text-xs text-slate-500">
                    Parsing pages and extracting text structure
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Drop lecture notes or syllabus here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports <span className="text-indigo-400 font-medium">.PDF</span> and{" "}
                      <span className="text-indigo-400 font-medium">.TXT</span> files (up to 10MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>

            {/* If file is uploaded, show preview info */}
            {fileName && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30">
                <div className="flex items-center gap-2.5 truncate">
                  <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">{fileName}</p>
                    <p className="text-[11px] text-slate-400">
                      {pdfPages ? `${pdfPages} pages • ` : ""}
                      {wordCount.toLocaleString()} words loaded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("paste")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap ml-2"
                >
                  View / Edit Text
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative">
            <textarea
              value={studyText}
              onChange={(e) => {
                setStudyText(e.target.value);
                if (fileName && e.target.value !== studyText) {
                  setFileName(`${fileName} (edited)`);
                }
              }}
              placeholder="Paste your lecture notes, textbook chapters, or computer engineering slides here...

Example:
Course: CS/CE 301 - Modern Computer Architecture
Topic: Cache Memory & Virtual Memory
- 4KB Paging
- TLB Hit vs. Miss penalties
- Translation steps..."
              className="w-full flex-1 min-h-[300px] p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none font-mono leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Footer Metadata & Study Statistics */}
      <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Total Word Count">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              <strong className="text-slate-200">{wordCount.toLocaleString()}</strong> words
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Total Characters">
            <Hash className="w-3.5 h-3.5 text-slate-500" />
            <span>
              <strong className="text-slate-200">{charCount.toLocaleString()}</strong> chars
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5" title="Estimated Reading Time">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>~{readingTimeMins} min read</span>
          </div>
        </div>

        {fileName && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 max-w-[200px] truncate">
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
