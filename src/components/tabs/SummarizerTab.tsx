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
} from "lucide-react";
import { SummaryData } from "@/lib/types";

interface SummarizerTabProps {
  studyText: string;
  cachedSummary?: SummaryData | null;
  onSaveSummary?: (summary: SummaryData) => void;
}

export function SummarizerTab({
  studyText,
  cachedSummary,
  onSaveSummary,
}: SummarizerTabProps) {
  const [summary, setSummary] = useState<SummaryData | null>(cachedSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyToClipboard = () => {
    if (!summary) return;

    let textContent = `# Study Summary\n\n`;

    textContent += `## Key Concepts\n`;
    summary.keyConcepts.forEach((c) => {
      textContent += `### ${c.title}\n${c.description}\n\n`;
    });

    textContent += `## Bullet Takeaways\n`;
    summary.bulletTakeaways.forEach((t) => {
      textContent += `- ${t}\n`;
    });

    textContent += `\n## Important Definitions\n`;
    summary.importantDefinitions.forEach((d) => {
      textContent += `- **${d.term}**: ${d.definition}\n`;
    });

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tab Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-400" />
            Document Summarizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Extracts high-yield Key Concepts, Bullet Takeaways, and Technical Definitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={handleCopyToClipboard}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleGenerateSummary}
            disabled={isLoading || !studyText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
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
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Content Display */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800/80 gap-3">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <h3 className="text-sm font-semibold text-slate-200">
            Synthesizing study material with Gemini 3.8 Flash...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm text-center">
            Structuring key concepts, distilling bullet takeaways, and organizing critical definitions.
          </p>
        </div>
      ) : summary ? (
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Section 1: Key Concepts */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4 text-indigo-400">
              <Lightbulb className="w-4 h-4" />
              1. Key Concepts ({summary.keyConcepts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {summary.keyConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col gap-1.5"
                >
                  <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {concept.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7">
                    {concept.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Bullet Takeaways */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              2. High-Yield Bullet Takeaways ({summary.bulletTakeaways.length})
            </h3>
            <ul className="space-y-2.5">
              {summary.bulletTakeaways.map((takeaway, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300 leading-relaxed hover:bg-slate-950/80 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Important Definitions */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4 text-cyan-400">
              <FileText className="w-4 h-4" />
              3. Important Definitions & Terminology ({summary.importantDefinitions.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.importantDefinitions.map((def, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1"
                >
                  <span className="inline-block text-xs font-bold text-cyan-300">
                    {def.term}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {def.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              No Summary Generated Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Add lecture notes on the left or click &quot;Load CE Sample&quot;, then click{" "}
              <strong className="text-indigo-300">Generate Summary</strong> to extract key insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
