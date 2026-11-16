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
    // If already answered this question, do not allow switching for instant test integrity
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
    <div className="flex flex-col h-full gap-4">
      {/* Quiz Tab Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Interactive Quiz Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            5 concept-checking questions with instant validation, explanations, and score tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalQuestions > 0 && answeredCount > 0 && (
            <button
              onClick={handleResetQuiz}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          <button
            onClick={handleGenerateQuiz}
            disabled={isLoading || !studyText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
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
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Score Tracker Bar when quiz is active */}
      {totalQuestions > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-200">
              Progress: {answeredCount} / {totalQuestions} Answered
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400 font-semibold">
              Current Score: {correctCount} / {answeredCount || 0} (
              {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%)
            </span>
          </div>

          <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Quiz Completion Celebration Banner */}
      {isCompleted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Quiz Complete! Final Score: {correctCount} / {totalQuestions} ({scorePercent}%)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      )}

      {/* Questions Content */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/50 border border-slate-800/80 gap-3">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <h3 className="text-sm font-semibold text-slate-200">
            Formulating 5 conceptual questions with Gemini 3.8 Flash...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm text-center">
            Writing plausible distractors, identifying key test points, and authoring explanations.
          </p>
        </div>
      ) : questions.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {questions.map((q, qIdx) => {
            const hasAnswered = userAnswers[q.id] !== undefined;
            const selectedOpt = userAnswers[q.id];
            const isUserCorrect = hasAnswered && selectedOpt === q.correctIndex;

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 transition-all"
              >
                {/* Question Title & Index */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      Q{qIdx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {hasAnswered && (
                    <div className="shrink-0">
                      {isUserCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
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
                      "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950";

                    if (hasAnswered) {
                      if (isCorrect) {
                        optionStyle =
                          "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/40";
                      } else if (isSelected) {
                        optionStyle =
                          "border-rose-500/60 bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/40";
                      } else {
                        optionStyle = "border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={hasAnswered}
                        className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all ${optionStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            hasAnswered && isCorrect
                              ? "bg-emerald-500 text-slate-950"
                              : hasAnswered && isSelected
                              ? "bg-rose-500 text-white"
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
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-200">Concept Explanation:</span>
                      <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">No Quiz Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Click <strong className="text-indigo-300">Generate 5 MCQs</strong> to test your
              knowledge with instant answer feedback and score tracking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
