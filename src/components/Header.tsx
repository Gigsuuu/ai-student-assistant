import React from "react";
import { Sparkles, Cpu, BookOpen, GraduationCap } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-800/90 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CogniStudy AI
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm">
                <Sparkles className="w-3 h-3 text-indigo-400" /> CE Hackathon
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 font-medium">
              <span>Computer Engineering Study Assistant</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 3.8 Flash
              </span>
            </p>
          </div>
        </div>

        {/* Action badges and quick overview */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200 font-medium shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Notes or Paste Lectures</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-600/50 text-indigo-200 font-bold shadow-sm">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>AI Study Companion</span>
          </div>
        </div>
      </div>
    </header>
  );
}
