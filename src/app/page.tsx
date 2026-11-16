"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { StudyInputPanel } from "@/components/StudyInputPanel";
import { SummarizerTab } from "@/components/tabs/SummarizerTab";
import { QuizTab } from "@/components/tabs/QuizTab";
import { FlashcardsTab } from "@/components/tabs/FlashcardsTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { BookMarked, GraduationCap, Layers, MessageSquare } from "lucide-react";
import { SummaryData, QuizQuestion, FlashcardItem } from "@/lib/types";

type ActiveTab = "summary" | "quiz" | "flashcards" | "chat";

interface CachedQuizData {
  questions: QuizQuestion[];
  userAnswers: Record<number, number>;
}

export default function Home() {
  const [studyText, setStudyText] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("summary");

  // React state cache keyed by document text for instant tab switching
  const [summaryCache, setSummaryCache] = useState<Record<string, SummaryData>>({});
  const [quizCache, setQuizCache] = useState<Record<string, CachedQuizData>>({});
  const [flashcardsCache, setFlashcardsCache] = useState<Record<string, FlashcardItem[]>>({});

  const trimmedText = studyText.trim();

  // Retrieve cached generations for the current document
  const currentCachedSummary = trimmedText ? summaryCache[trimmedText] || null : null;
  const currentCachedQuiz = trimmedText ? quizCache[trimmedText] || null : null;
  const currentCachedFlashcards = trimmedText ? flashcardsCache[trimmedText] || null : null;

  const handleSaveSummary = (data: SummaryData) => {
    if (trimmedText) {
      setSummaryCache((prev) => ({ ...prev, [trimmedText]: data }));
    }
  };

  const handleSaveQuiz = (data: CachedQuizData) => {
    if (trimmedText) {
      setQuizCache((prev) => ({ ...prev, [trimmedText]: data }));
    }
  };

  const handleSaveFlashcards = (cards: FlashcardItem[]) => {
    if (trimmedText) {
      setFlashcardsCache((prev) => ({ ...prev, [trimmedText]: cards }));
    }
  };

  const handleClearAll = () => {
    setStudyText("");
    setFileName(null);
  };

  const tabs = [
    {
      id: "summary" as ActiveTab,
      label: "Summarizer",
      icon: BookMarked,
      tag: "Concepts & Notes",
    },
    {
      id: "quiz" as ActiveTab,
      label: "Quiz Generator",
      icon: GraduationCap,
      tag: "5 MCQs Check",
    },
    {
      id: "flashcards" as ActiveTab,
      label: "Flashcards",
      icon: Layers,
      tag: "3D Active Recall",
    },
    {
      id: "chat" as ActiveTab,
      label: "Academic Q&A",
      icon: MessageSquare,
      tag: "Grounded Chat",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Application Header */}
      <Header />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Left Column: Document Ingestion (5 columns on large screens) */}
          <div className="lg:col-span-5 flex flex-col h-[650px] lg:sticky lg:top-20">
            <StudyInputPanel
              studyText={studyText}
              setStudyText={setStudyText}
              fileName={fileName}
              setFileName={setFileName}
              onClear={handleClearAll}
            />
          </div>

          {/* Right Column: 4 Feature Tabs (7 columns on large screens) */}
          <div className="lg:col-span-7 flex flex-col h-[650px] bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Feature Tabs Navigation Bar */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[130px] flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate leading-tight">{tab.label}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isActive ? "text-indigo-200" : "text-slate-500"
                        }`}
                      >
                        {tab.tag}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tab View Body with DOM persistence & document-keyed caching */}
            <div className="p-4 sm:p-5 flex-1 overflow-hidden flex flex-col bg-slate-950/40">
              <div className={activeTab === "summary" ? "h-full flex flex-col" : "hidden"}>
                <SummarizerTab
                  studyText={studyText}
                  cachedSummary={currentCachedSummary}
                  onSaveSummary={handleSaveSummary}
                />
              </div>

              <div className={activeTab === "quiz" ? "h-full flex flex-col" : "hidden"}>
                <QuizTab
                  studyText={studyText}
                  cachedQuiz={currentCachedQuiz}
                  onSaveQuiz={handleSaveQuiz}
                />
              </div>

              <div className={activeTab === "flashcards" ? "h-full flex flex-col" : "hidden"}>
                <FlashcardsTab
                  studyText={studyText}
                  cachedFlashcards={currentCachedFlashcards}
                  onSaveFlashcards={handleSaveFlashcards}
                />
              </div>

              <div className={activeTab === "chat" ? "h-full flex flex-col" : "hidden"}>
                <ChatTab studyText={studyText} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Built for Computer Engineering Hackathon with Next.js, Tailwind CSS & Google Gemini API
      </footer>
    </div>
  );
}
