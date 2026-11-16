"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { QuizQuestion } from "@/lib/types";

interface QuizTabProps {
  studyText: string;
  cachedQuiz?: { questions: QuizQuestion[]; userAnswers: Record<number, number> } | null;
  onSaveQuiz?: (quizData: { questions: QuizQuestion[]; userAnswers: Record<number, number> }) => void;
}

export function QuizTab({
  studyText,
  cachedQuiz,
  onSaveQuiz,
}: QuizTabProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(cachedQuiz?.questions || []);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>(cachedQuiz?.userAnswers || {});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when cachedQuiz for the current document changes
  useEffect(() => {
    if (cachedQuiz) {
      setQuestions(cachedQuiz.questions);
      setUserAnswers(cachedQuiz.userAnswers);
    } else if (cachedQuiz === null) {
      setQuestions([]);
      setUserAnswers({});
    }
  }, [cachedQuiz]);

  const handleGenerateQuiz = async () => {
    if (!studyText.trim()) {
      setErrorMessage("Please enter or upload study notes on the left panel first.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setUserAnswers({});

    try {
      const res = await fetch("/api/quiz", {
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

      const newQuestions = data?.questions || [];
      if (newQuestions.length === 0) {
        throw new Error("No quiz questions were returned by the API.");
      }

      setQuestions(newQuestions);
      onSaveQuiz?.({ questions: newQuestions, userAnswers: {} });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    // If already answered this question, do not allow switching for test integrity
    if (userAnswers[questionId] !== undefined) return;

    const updatedAnswers = {
      ...userAnswers,
      [questionId]: optionIndex,
    };

    setUserAnswers(updatedAnswers);
    onSaveQuiz?.({ questions, userAnswers: updatedAnswers });
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    onSaveQuiz?.({ questions, userAnswers: {} });
  };

  // Compute live score
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  let correctCount = 0;

  questions.forEach((q) => {
    if (userAnswers[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  });

  const isCompleted = totalQuestions > 0 && answeredCount === totalQuestions;
  const scorePercent = answeredCount > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="flex flex-col h-full gap-3.5 sm:gap-4">
      {/* Quiz Tab Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0" />
            Interactive Quiz Generator
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            5 concept-checking questions with instant validation, explanations, and score tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {totalQuestions > 0 && answeredCount > 0 && (
            <button
              onClick={handleResetQuiz}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Retry</span>
            </button>
          )}

          <button
            onClick={handleGenerateQuiz}
            disabled={isLoading || !studyText.trim()}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting 5 MCQs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{totalQuestions > 0 ? "Generate New Quiz" : "Generate 5 MCQs"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Score Tracker Bar when quiz is active */}
      {totalQuestions > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="font-bold text-slate-100">
              Progress: {answeredCount} / {totalQuestions} Answered
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-indigo-300 font-bold">
              Current Score: {correctCount} / {answeredCount || 0} (
              {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%)
            </span>
          </div>

          <div className="w-36 sm:w-44 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Quiz Completion Celebration Banner */}
      {isCompleted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/40 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Quiz Complete! Final Score: {correctCount} / {totalQuestions} ({scorePercent}%)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {scorePercent >= 80
                  ? "Outstanding grasp of the concepts! Ready for the exam."
                  : scorePercent >= 60
                  ? "Good effort! Review the explanations below to solidify difficult areas."
                  : "Keep practicing! Review the summary notes and retry."}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetQuiz}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
          >
            Retake Quiz
          </button>
        </div>
      )}

      {/* Questions Content */}
      {isLoading ? (
        /* Clean Animated Tailwind CSS Skeleton Loader */
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 animate-fadeIn">
          {/* Skeleton Status Banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Formulating 5 conceptual MCQs with Gemini 3.8 Flash...</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                </p>
                <p className="text-[11px] text-slate-300 font-medium">
                  Identifying high-yield exam points, authoring options, and explanations
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-[11px] font-semibold border border-indigo-500/25">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generating Quiz</span>
            </div>
          </div>

          {/* Skeleton Question Cards */}
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-800/70 rounded animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {["A", "B", "C", "D"].map((letter) => (
                  <div
                    key={letter}
                    className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-md bg-slate-800 animate-pulse shrink-0" />
                    <div className="h-3.5 w-3/4 bg-slate-800/80 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : questions.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 pr-1">
          {questions.map((q, qIdx) => {
            const hasAnswered = userAnswers[q.id] !== undefined;
            const selectedOpt = userAnswers[q.id];
            const isUserCorrect = hasAnswered && selectedOpt === q.correctIndex;

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 transition-all shadow-sm"
              >
                {/* Question Title & Index */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                      Q{qIdx + 1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {hasAnswered && (
                    <div className="shrink-0">
                      {isUserCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((option, optIdx) => {
                    const letters = ["A", "B", "C", "D"];
                    const isSelected = selectedOpt === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let optionStyle =
                      "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700 hover:bg-slate-950 focus-visible:ring-indigo-400";

                    if (hasAnswered) {
                      if (isCorrect) {
                        optionStyle =
                          "border-emerald-500/70 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/50";
                      } else if (isSelected) {
                        optionStyle =
                          "border-rose-500/70 bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/50";
                      } else {
                        optionStyle = "border-slate-800/60 bg-slate-950/30 text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={hasAnswered}
                        className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${optionStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            hasAnswered && isCorrect
                              ? "bg-emerald-400 text-slate-950 font-bold"
                              : hasAnswered && isSelected
                              ? "bg-rose-500 text-white font-bold"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {letters[optIdx]}
                        </span>
                        <span className="flex-1 leading-snug">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Explanation Box */}
                {hasAnswered && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs flex items-start gap-2.5 shadow-sm">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-slate-100">Concept Explanation:</span>
                      <p className="text-slate-200 leading-relaxed font-normal">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">No Quiz Generated Yet</h3>
            <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
              Click <strong className="text-indigo-400 font-semibold">Generate 5 MCQs</strong> to test your
              knowledge with instant answer feedback and score tracking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
