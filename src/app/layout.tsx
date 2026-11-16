import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CogniStudy AI — Engineering Student Assistant",
  description:
    "AI-Powered study dashboard for Computer Engineering students. Generate summaries, 5-question quizzes, flip flashcards, and contextual Q&A from your lecture notes using Google Gemini API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
