"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCw,
  RotateCcw,
  LayoutGrid,
  Square,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { FlashcardItem } from "@/lib/types";

interface FlashcardsTabProps {
  studyText: string;
  cachedFlashcards?: FlashcardItem[] | null;
  onSaveFlashcards?: (cards: FlashcardItem[]) => void;
}

export function FlashcardsTab({
  studyText,
  cachedFlashcards,
  onSaveFlashcards,
}: FlashcardsTabProps) {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(cachedFlashcards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isNotesEmpty = !studyText.trim();

  // Sync state when cachedFlashcards for the current document changes
  useEffect(() => {
    if (cachedFlashcards) {
      setFlashcards(cachedFlashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else if (cachedFlashcards === null) {
      setFlashcards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [cachedFlashcards]);

  const totalCards = flashcards.length;
  const currentCard = flashcards[currentIndex];

  const handleGenerateFlashcards = async () => {
    // Guard against simultaneous or empty submissions
    if (isLoading || isNotesEmpty) {
      if (isNotesEmpty) {
        setErrorMessage("Please enter or upload study notes on the left panel first.");
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: studyText }),
      });

      let data = await res.json().catch(() => null);

      // Handle raw string responses defensively if returned by any proxy
      if (typeof data === "string") {
        try {
          const stripped = data.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
          data = JSON.parse(stripped);
        } catch {
          // Keep raw data
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.error || `Request failed with status ${res.status} (${res.statusText})`
        );
      }

      const newCards = data?.flashcards;
      if (!newCards || !Array.isArray(newCards) || newCards.length === 0) {
        throw new Error("The AI returned a malformed flashcard format. Please click Retry Generation.");
      }

      setFlashcards(newCards);
      onSaveFlashcards?.(newCards);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred while generating flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (totalCards === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = () => {
    if (totalCards === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const handleShuffle = () => {
    if (flashcards.length <= 1) return;
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    onSaveFlashcards?.(shuffled);
  };

  // Keyboard navigation support: Left Arrow = prev, Right Arrow = next, Space/Enter = flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "single" || totalCards === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalCards, viewMode]);

  return (
    <div className="flex flex-col h-full gap-3.5 sm:gap-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
            Flashcard Creator
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Generates 6-8 interactive 3D click-to-flip cards for active recall.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {totalCards > 0 && (
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`p-1.5 rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  viewMode === "single"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Single Card Practice View"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Grid Overview (All Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {totalCards > 1 && viewMode === "single" && (
            <button
              onClick={handleShuffle}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
              title="Shuffle Cards"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shuffle</span>
            </button>
          )}

          {isNotesEmpty && !isLoading && (
            <span className="text-[11px] text-slate-400 italic">
              Add study notes on the left to generate
            </span>
          )}

          <button
            onClick={handleGenerateFlashcards}
            disabled={isLoading || isNotesEmpty}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Cards...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{totalCards > 0 ? "Regenerate Cards" : "Generate 6-8 Cards"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Notice with Clean Retry Generation Button */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={handleGenerateFlashcards}
            disabled={isLoading || isNotesEmpty}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/25 hover:bg-rose-500/35 text-rose-100 border border-rose-500/45 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Generation</span>
          </button>
        </div>
      )}

      {/* Main Flashcard Display */}
      {isLoading ? (
        /* Clean Animated Tailwind CSS Skeleton Loader */
        <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-[360px] animate-fadeIn p-4">
          {/* Skeleton Counter & Category Header */}
          <div className="flex items-center justify-between w-full max-w-md px-1">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span className="text-xs text-slate-200 font-semibold">
                Synthesizing flashcards with Gemini 3.8 Flash...
              </span>
            </div>
            <div className="h-5 w-24 bg-indigo-500/20 rounded-full animate-pulse border border-indigo-500/30" />
          </div>

          {/* Skeleton 3D Card Box */}
          <div className="w-full max-w-md h-72 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-slate-800/90 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-indigo-500/20 rounded-md animate-pulse border border-indigo-500/30" />
              <div className="w-4 h-4 rounded-full bg-slate-800 animate-pulse" />
            </div>

            <div className="text-center my-auto px-4 space-y-3">
              <div className="h-6 w-3/4 mx-auto bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 mx-auto bg-slate-800/70 rounded animate-pulse" />
            </div>

            <div className="flex justify-center">
              <div className="h-3 w-48 bg-slate-800/50 rounded animate-pulse" />
            </div>
          </div>

          {/* Skeleton Controls */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-16 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            <div className="h-8 w-24 bg-indigo-600/20 border border-indigo-500/30 rounded-xl animate-pulse" />
            <div className="h-8 w-16 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : totalCards > 0 ? (
        viewMode === "single" ? (
          /* Single Card Practice Mode with 3D Flip */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-5 min-h-[360px]">
            {/* Card Counter & Category Badge */}
            <div className="flex items-center justify-between w-full max-w-md px-1 text-xs">
              <span className="font-bold text-slate-100">
                Card {currentIndex + 1} of {totalCards}
              </span>
              {currentCard?.category && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                  {currentCard.category}
                </span>
              )}
            </div>

            {/* 3D Flip Card Container */}
            <div
              onClick={() => setIsFlipped((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsFlipped((prev) => !prev);
                }
              }}
              className="w-full max-w-md h-72 cursor-pointer perspective-1000 select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-2xl"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border-2 border-slate-800 group-hover:border-indigo-500/50 p-6 flex flex-col justify-between shadow-2xl transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-md border border-indigo-500/30">
                      Front • Term / Concept
                    </span>
                    <RotateCw className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>

                  <div className="text-center my-auto px-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {currentCard?.term}
                    </h3>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors font-medium">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Click card or press Space to reveal answer
                    </span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border-2 border-emerald-500/50 p-6 flex flex-col justify-between shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      Back • Definition & Details
                    </span>
                    <RotateCw className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="text-center my-auto px-4">
                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                      {currentCard?.definition}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] text-emerald-300 font-semibold">
                      Click to flip back to front
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handlePrev}
                type="button"
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
                title="Previous Card (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                onClick={() => setIsFlipped((prev) => !prev)}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip Card</span>
              </button>

              <button
                onClick={handleNext}
                type="button"
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
                title="Next Card (Right Arrow)"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Grid Overview Mode */
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pr-1">
            {flashcards.map((card, idx) => (
              <div
                key={card.id || idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 flex flex-col justify-between gap-3 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400">Card #{idx + 1}</span>
                    {card.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                        {card.category}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{card.term}</h4>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">{card.definition}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">No Flashcards Generated Yet</h3>
            <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
              Click <strong className="text-indigo-400 font-semibold">Generate 6-8 Cards</strong> to create
              study flashcards with 3D flip animation and active recall mode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
