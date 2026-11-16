/**
 * Shared TypeScript types for AI-Powered Student Assistant
 */

export interface SummaryData {
  keyConcepts: {
    title: string;
    description: string;
  }[];
  bulletTakeaways: string[];
  importantDefinitions: {
    term: string;
    definition: string;
  }[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // 0, 1, 2, or 3
  explanation: string;
}

export interface FlashcardItem {
  id: number;
  term: string;
  definition: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
  failedQuestion?: string;
}

export interface ParsePdfResponse {
  text: string;
  numPages: number;
  info?: Record<string, unknown>;
  error?: string;
}
