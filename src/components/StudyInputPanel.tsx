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
  X,
  XCircle,
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

  // Calculate live statistics cleanly
  const trimmed = studyText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = studyText.length;
  // Average reading speed: ~200 words per minute; 0 when empty
  const readingTimeMins = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : 0;

  const hasContent = trimmed.length > 0 || fileName !== null;

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
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden focus-within:border-slate-700/80 transition-all">
      {/* Top Bar with Mode Switcher & Actions */}
      <div className="p-3 sm:p-4 border-b border-slate-800/90 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
                activeTab === "paste"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-850"
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
                activeTab === "upload"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-850"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload File
            </button>
          </div>
        </div>

        {/* Action Controls: Clear Input & Sample Loader */}
        <div className="flex items-center gap-2">
          {/* Dedicated Clear Input button */}
          <button
            onClick={handleClearAll}
            type="button"
            disabled={!hasContent}
            title={hasContent ? "Clear input text, file, and reset stats" : "Input area is currently empty"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-700/80 hover:border-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-800 disabled:hover:text-slate-500 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-[0.97]"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold">Clear Input</span>
          </button>

          {/* Demo Sample Loader Button */}
          <button
            onClick={handleLoadSample}
            type="button"
            title="Load ready-to-test Computer Engineering lecture notes"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/35 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
            <span>Load CE Sample</span>
          </button>
        </div>
      </div>

      {/* Main Material Input Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-3 min-h-[360px]">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-200">Document Notice</p>
              <p className="text-rose-200/90 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`flex-1 border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                isDragging
                  ? "border-indigo-400 bg-indigo-500/15 scale-[0.99]"
                  : "border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-950/70"
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
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-slate-100">
                    Extracting study material from document...
                  </p>
                  <p className="text-xs text-slate-400">
                    Parsing pages and extracting text structure
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/10">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base font-bold text-slate-100">
                      Drop lecture notes or syllabus here
                    </p>
                    <p className="text-xs text-slate-300">
                      Supports <span className="text-indigo-400 font-semibold">.PDF</span> and{" "}
                      <span className="text-indigo-400 font-semibold">.TXT</span> files (up to 10MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors shadow-sm">
                      Browse Files
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* If file is uploaded, show preview info with Clear button */}
            {fileName && (
              <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/35 shadow-sm">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-100 truncate">{fileName}</p>
                    <p className="text-[11px] text-slate-300 font-medium">
                      {pdfPages ? `${pdfPages} pages • ` : ""}
                      {wordCount.toLocaleString()} words loaded
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => setActiveTab("paste")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold whitespace-nowrap px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                  >
                    View / Edit Text
                  </button>
                  <button
                    onClick={handleClearAll}
                    title="Clear uploaded document"
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative group">
            {/* Quick in-textarea Clear button when text is present */}
            {trimmed.length > 0 && (
              <div className="absolute top-2.5 right-2.5 z-10">
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear all text"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-300 hover:text-rose-300 bg-slate-900/95 hover:bg-rose-950/50 border border-slate-700/80 hover:border-rose-500/40 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-[0.97]"
                >
                  <X className="w-3 h-3 text-rose-400" />
                  <span>Clear</span>
                </button>
              </div>
            )}

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
              className="w-full flex-1 min-h-[300px] p-3.5 sm:p-4 rounded-xl bg-slate-950/75 border border-slate-700/80 text-slate-100 text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 resize-none font-mono leading-relaxed transition-all selection:bg-indigo-600 selection:text-white"
            />
          </div>
        )}
      </div>

      {/* Footer Metadata & Study Statistics */}
      <div className="px-3.5 sm:px-4 py-3 bg-slate-950/90 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5" title="Total Word Count">
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">{wordCount.toLocaleString()}</strong> words
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Total Characters">
            <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">{charCount.toLocaleString()}</strong> chars
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Estimated Reading Time">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">
              ~<strong className="text-white font-bold">{readingTimeMins}</strong> min read
            </span>
          </div>
        </div>

        {fileName && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30 max-w-[220px] truncate font-medium">
            <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
