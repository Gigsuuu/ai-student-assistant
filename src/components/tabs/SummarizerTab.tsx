"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookMarked,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  FileDown,
} from "lucide-react";
import { SummaryData, FlashcardItem } from "@/lib/types";

interface SummarizerTabProps {
  studyText: string;
  fileName?: string | null;
  flashcards?: FlashcardItem[] | null;
  cachedSummary?: SummaryData | null;
  onSaveSummary?: (summary: SummaryData) => void;
}

export function SummarizerTab({
  studyText,
  fileName,
  flashcards = [],
  cachedSummary,
  onSaveSummary,
}: SummarizerTabProps) {
  const [summary, setSummary] = useState<SummaryData | null>(cachedSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Sync state when cachedSummary for the current document changes
  useEffect(() => {
    if (cachedSummary !== undefined) {
      setSummary(cachedSummary);
    }
  }, [cachedSummary]);

  const handleGenerateSummary = async () => {
    if (!studyText.trim()) {
      setErrorMessage("Please enter or upload study notes on the left panel first.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: studyText }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || `Request failed with status ${res.status} (${res.statusText})`
        );
      }

      if (!data?.summary) {
        throw new Error("Invalid response format received from summarizer API.");
      }

      setSummary(data.summary);
      onSaveSummary?.(data.summary);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copies formatted summary text to user clipboard with confirmation
   */
  const handleCopyToClipboard = () => {
    if (!summary) return;

    let textContent = `# CogniStudy AI — Document Summary\n\n`;
    if (fileName) {
      textContent += `Source: ${fileName}\n\n`;
    }

    textContent += `## 1. Key Concepts\n`;
    summary.keyConcepts.forEach((c, idx) => {
      textContent += `### ${idx + 1}. ${c.title}\n${c.description}\n\n`;
    });

    textContent += `## 2. High-Yield Bullet Takeaways\n`;
    summary.bulletTakeaways.forEach((t) => {
      textContent += `- ${t}\n`;
    });

    textContent += `\n## 3. Important Definitions & Terminology\n`;
    summary.importantDefinitions.forEach((d) => {
      textContent += `- **${d.term}**: ${d.definition}\n`;
    });

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Exports both generated summary and flashcards into a clean .txt study sheet
   */
  const handleDownloadStudyNotes = () => {
    if (!summary) return;

    const timestamp = new Date().toLocaleString();
    const docTitle = fileName || "Lecture Study Material";

    let content = "";
    content += "================================================================================\n";
    content += "                   COGNISTUDY AI — COMPREHENSIVE STUDY NOTES                   \n";
    content += "================================================================================\n";
    content += `Source Document : ${docTitle}\n`;
    content += `Generated On    : ${timestamp}\n`;
    content += `AI Engine       : Google Gemini 3.8 Flash (Computer Engineering Edition)\n`;
    content += "================================================================================\n\n";

    content += "--------------------------------------------------------------------------------\n";
    content += `1. KEY CONCEPTS & CORE THEORIES (${summary.keyConcepts.length})\n`;
    content += "--------------------------------------------------------------------------------\n";
    summary.keyConcepts.forEach((c, idx) => {
      content += `\n[Concept ${idx + 1}] ${c.title}\n`;
      content += `  Description: ${c.description}\n`;
    });

    content += "\n--------------------------------------------------------------------------------\n";
    content += `2. HIGH-YIELD BULLET TAKEAWAYS (${summary.bulletTakeaways.length})\n`;
    content += "--------------------------------------------------------------------------------\n";
    summary.bulletTakeaways.forEach((t, idx) => {
      content += `• (${idx + 1}) ${t}\n`;
    });

    content += "\n--------------------------------------------------------------------------------\n";
    content += `3. IMPORTANT DEFINITIONS & TECHNICAL VOCABULARY (${summary.importantDefinitions.length})\n`;
    content += "--------------------------------------------------------------------------------\n";
    summary.importantDefinitions.forEach((d, idx) => {
      content += `[${idx + 1}] ${d.term.toUpperCase()}:\n    ${d.definition}\n\n`;
    });

    content += "--------------------------------------------------------------------------------\n";
    content += `4. ACTIVE RECALL FLASHCARDS (${flashcards && flashcards.length > 0 ? flashcards.length : 0})\n`;
    content += "--------------------------------------------------------------------------------\n";
    if (flashcards && flashcards.length > 0) {
      flashcards.forEach((card, idx) => {
        content += `\n[Flashcard #${idx + 1}]${card.category ? ` [${card.category}]` : ""}\n`;
        content += `  Question / Term : ${card.term}\n`;
        content += `  Answer / Concept: ${card.definition}\n`;
      });
    } else {
      content += "\n(Note: Flashcards were not yet generated during this study session.\n Switch to the Flashcards tab in CogniStudy to generate 3D active recall cards.)\n";
    }

    content += "\n================================================================================\n";
    content += "                      END OF COGNISTUDY AI STUDY NOTES                          \n";
    content += "================================================================================\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseClean = fileName ? fileName.replace(/\.[^/.]+$/, "") : "cognistudy";
    link.href = url;
    link.download = `${baseClean}_study_notes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-3.5 sm:gap-4">
      {/* Tab Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-400 shrink-0" />
            Document Summarizer
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Extracts high-yield Key Concepts, Bullet Takeaways, and Technical Definitions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {summary && (
            <>
              {/* Copy Summary Button */}
              <button
                onClick={handleCopyToClipboard}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
                title="Copy markdown summary to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              {/* Download Study Notes (.txt) Button */}
              <button
                onClick={handleDownloadStudyNotes}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
                title="Download formatted text file with summary and flashcards"
              >
                {downloaded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download Study Notes (.txt)</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            onClick={handleGenerateSummary}
            disabled={isLoading || !studyText.trim()}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Summary...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{summary ? "Regenerate Summary" : "Generate Summary"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Main Content Display */}
      {isLoading ? (
        /* Clean Animated Tailwind CSS Skeleton Loader */
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 animate-fadeIn">
          {/* Shimmer Status Banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Synthesizing study material with Gemini 3.8 Flash...</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                </p>
                <p className="text-[11px] text-slate-300 font-medium">
                  Structuring key concepts, distilling bullet takeaways, and organizing definitions
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-[11px] font-semibold border border-indigo-500/25">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              <span>Analyzing Document</span>
            </div>
          </div>

          {/* Skeleton Section 1: Key Concepts */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-500/30 animate-pulse" />
              <div className="h-4 w-40 bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 animate-pulse shrink-0" />
                    <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2 pl-7">
                    <div className="h-3 w-full bg-slate-800/70 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-slate-800/70 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-slate-800/70 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Section 2: Bullet Takeaways */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/30 animate-pulse" />
              <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse shrink-0" />
                  <div
                    className="h-3.5 bg-slate-800 rounded animate-pulse flex-1"
                    style={{ width: `${80 + (i % 3) * 8}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Section 3: Important Definitions */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500/30 animate-pulse" />
              <div className="h-4 w-52 bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                >
                  <div className="h-3.5 w-1/3 bg-cyan-500/20 rounded animate-pulse" />
                  <div className="h-3 w-full bg-slate-800/70 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-slate-800/70 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : summary ? (
        <div className="flex-1 overflow-y-auto space-y-5 sm:space-y-6 pr-1">
          {/* Document Summarizer Output Card Header Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                  Document Summarizer Output
                </h3>
                <p className="text-[11px] text-slate-300">
                  {summary.keyConcepts.length} Concepts • {summary.bulletTakeaways.length} Takeaways •{" "}
                  {summary.importantDefinitions.length} Definitions
                </p>
              </div>
            </div>

            {/* Quick Action Export Buttons on Output Card */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyToClipboard}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadStudyNotes}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
              >
                {downloaded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Study Notes (.txt)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 1: Key Concepts */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4 text-indigo-400">
              <Lightbulb className="w-4 h-4 shrink-0" />
              1. Key Concepts ({summary.keyConcepts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {summary.keyConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col gap-1.5 shadow-sm"
                >
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{concept.title}</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed pl-7 font-normal">
                    {concept.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Bullet Takeaways */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              2. High-Yield Bullet Takeaways ({summary.bulletTakeaways.length})
            </h3>
            <ul className="space-y-2.5">
              {summary.bulletTakeaways.map((takeaway, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 leading-relaxed hover:bg-slate-950/90 transition-colors shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5 ring-2 ring-emerald-500/20" />
                  <span className="font-normal">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Important Definitions */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4 text-cyan-400">
              <FileText className="w-4 h-4 shrink-0" />
              3. Important Definitions & Terminology ({summary.importantDefinitions.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.importantDefinitions.map((def, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col gap-1.5 shadow-sm"
                >
                  <span className="inline-block text-xs font-bold text-cyan-300">
                    {def.term}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {def.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              No Summary Generated Yet
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
              Add lecture notes on the left or click &quot;Load CE Sample&quot;, then click{" "}
              <strong className="text-indigo-400 font-semibold">Generate Summary</strong> to extract key insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
