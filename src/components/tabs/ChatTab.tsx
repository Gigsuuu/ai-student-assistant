"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Loader2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { ChatMessage } from "@/lib/types";

interface ChatTabProps {
  studyText: string;
}

const STARTER_PROMPTS = [
  "Summarize the main trade-offs mentioned in these notes.",
  "Explain the hardest concept here using a real-world analogy.",
  "What are 3 typical exam questions a professor would ask on this?",
  "Break down the step-by-step mechanical flow described.",
];

export function ChatTab({ studyText }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  const isNotesEmpty = !studyText.trim();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    // Guard against simultaneous submissions or empty notes
    if (isLoading) return;
    const question = (textToSend || inputMessage).trim();
    if (!question) return;

    if (isNotesEmpty) {
      setErrorMessage("Please enter or upload study notes on the left panel first.");
      return;
    }

    setErrorMessage(null);
    setLastFailedQuestion(null);
    setInputMessage("");

    // If retrying from an error state, strip the previous failed assistant message
    let baseHistory = messages;
    if (baseHistory.length > 0 && baseHistory[baseHistory.length - 1].isError) {
      baseHistory = baseHistory.slice(0, -1);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...baseHistory, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Bound conversation history to last 10 messages max to prevent payload overflow
      const boundedHistory = newHistory.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          context: studyText,
          history: boundedHistory,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || `Request failed with status ${res.status} (${res.statusText})`
        );
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.reply || "No reply was generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages([...newHistory, botMsg]);
    } catch (err: unknown) {
      const error = err as Error;
      const friendlyErr = error.message || "Failed to generate an answer from your notes.";
      setErrorMessage(friendlyErr);
      setLastFailedQuestion(question);

      // Friendly retry message in chat thread
      const friendlyBotErrorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I had trouble generating an answer based on your lecture notes. Please click Retry below to try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
        failedQuestion: question,
      };

      setMessages([...newHistory, friendlyBotErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isLoading && !isNotesEmpty && inputMessage.trim()) {
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    setErrorMessage(null);
    setLastFailedQuestion(null);
  };

  return (
    <div className="flex flex-col h-full gap-3.5 sm:gap-4">
      {/* Chat Tab Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0" />
            Academic Q&A Chat
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Strictly grounded in your uploaded material to prevent hallucinations.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-750 hover:border-rose-500/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Error Alert with Friendly Retry */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
          {lastFailedQuestion && (
            <button
              onClick={() => handleSendMessage(lastFailedQuestion)}
              disabled={isLoading || isNotesEmpty}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/25 hover:bg-rose-500/35 text-rose-100 border border-rose-500/45 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Question</span>
            </button>
          )}
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4 min-h-[320px]">
        {messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-4 sm:p-6 gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Ask Questions Grounded in Your Notes
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
                Your AI Teaching Assistant will only answer questions based on the uploaded lecture
                material, preventing exam confusion.
              </p>
            </div>

            {/* Suggested Starter Prompts */}
            <div className="w-full max-w-lg mt-2 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Suggested Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !isNotesEmpty && handleSendMessage(prompt)}
                    disabled={isNotesEmpty || isLoading}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-start gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isNotesEmpty
                        ? "bg-slate-950/40 border border-slate-850 text-slate-500 cursor-not-allowed"
                        : "bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-white active:scale-[0.98]"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : msg.isError
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-slate-800 text-indigo-400 border border-slate-700"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20 font-medium"
                      : msg.isError
                      ? "bg-rose-950/40 text-rose-100 border border-rose-500/35 rounded-tl-none whitespace-pre-wrap font-sans shadow-sm"
                      : "bg-slate-950/90 text-slate-100 border border-slate-800 rounded-tl-none whitespace-pre-wrap font-sans shadow-sm"
                  }`}
                >
                  <div>{msg.content}</div>

                  {msg.isError && msg.failedQuestion && (
                    <div className="mt-2.5 pt-2 border-t border-rose-500/25 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendMessage(msg.failedQuestion)}
                        disabled={isLoading || isNotesEmpty}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/35 text-rose-100 border border-rose-500/40 transition-colors disabled:opacity-50 active:scale-[0.98]"
                      >
                        <RotateCcw className="w-3 h-3 text-rose-300" />
                        <span>Retry Question</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1.5 ${
                      msg.role === "user" ? "text-indigo-200 text-right" : msg.isError ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Clean Animated Tailwind CSS Skeleton for Chat Generation */}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto animate-fadeIn">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 rounded-tl-none text-xs space-y-2 flex-1 min-w-[220px] shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold pb-1.5 border-b border-slate-800/80">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                    <span>Grounded in your lecture notes...</span>
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="h-3 w-5/6 bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-full bg-slate-800/80 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-slate-800/60 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Message Form with Subtle Helper Prompt */}
      <div className="flex flex-col gap-1.5">
        {isNotesEmpty && (
          <p className="text-[11px] text-slate-400 italic px-1">
            Add or paste study notes on the left panel to enable academic chat.
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isNotesEmpty
                ? "Please upload or paste notes on the left first to ask questions..."
                : "Ask a question about the study notes (e.g., 'What happens during a TLB miss?')..."
            }
            disabled={isLoading || isNotesEmpty}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim() || isNotesEmpty}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            title={isNotesEmpty ? "Upload study notes on the left first" : "Send Question"}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
