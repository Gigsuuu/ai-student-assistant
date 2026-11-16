import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { NextRequest, NextResponse } from "next/server";
import {
  GeminiApiError,
  callGeminiDirect,
  cleanAndParseJSON,
  truncateDocument,
} from "@/lib/gemini";
import { QuizQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QuizResponseWrapper {
  questions: QuizQuestion[];
}

/**
 * POST /api/quiz
 * Generates 5 multiple-choice questions with options, correct answer index,
 * and explanations. Uses IPv4 first DNS order and 30-second AbortController timeout.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Study material cannot be empty. Please upload or paste notes first." },
        { status: 400 }
      );
    }

    const { text } = body;

    if (text.trim().length < 40) {
      return NextResponse.json(
        { error: "Study text is too short to generate a meaningful quiz. Please provide more content." },
        { status: 400 }
      );
    }

    // Truncate document text to 12,000 characters max before building prompt
    const truncatedText = truncateDocument(text, 12000);

    const prompt = `
You are a Computer Engineering professor creating an exam review quiz.
Based on the following study material, generate EXACTLY 5 high-quality, conceptual multiple-choice questions.

You MUST respond strictly with a valid JSON object matching this TypeScript interface:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear question text testing understanding or mechanics",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctIndex": 0, // Zero-based index (0, 1, 2, or 3)
      "explanation": "1-2 sentence explanation of why this answer is correct."
    }
  ]
}

Guidelines:
- Create exactly 5 questions (IDs 1 through 5).
- Each question must have exactly 4 plausible options.
- Keep questions, options, and explanations concise to fit within 1024 tokens.
- Ground all questions strictly in the concepts presented in the text.

STUDY MATERIAL:
${truncatedText}
`;

    // Direct fetch with clean generationConfig and 30-second AbortController timeout
    const responseText = await callGeminiDirect({
      prompt,
      responseMimeType: "application/json",
      timeoutMs: 30000,
    });

    let parsedData: QuizResponseWrapper;
    try {
      parsedData = cleanAndParseJSON<QuizResponseWrapper>(responseText);
    } catch (parseErr) {
      console.error("[/api/quiz] JSON parse failed on text:", responseText.slice(0, 300), parseErr);
      return NextResponse.json(
        {
          error: "AI response contained invalid or malformed JSON formatting. Please retry generation.",
          isParseError: true,
        },
        { status: 502 }
      );
    }

    if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
      return NextResponse.json(
        {
          error: "The AI did not return a valid list of quiz questions. Please retry generation.",
          isParseError: true,
        },
        { status: 502 }
      );
    }

    // Defensive normalization of questions to ensure no crashing in frontend
    const validatedQuestions: QuizQuestion[] = parsedData.questions
      .filter((q) => q && typeof q.question === "string" && Array.isArray(q.options))
      .map((q, idx) => ({
        id: typeof q.id === "number" ? q.id : idx + 1,
        question: q.question.trim(),
        options: Array.isArray(q.options) ? q.options.map((opt) => String(opt || "").trim()) : [],
        correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < (q.options?.length || 4)
          ? q.correctIndex
          : 0,
        explanation: typeof q.explanation === "string" ? q.explanation.trim() : "Correct answer based on the lecture material.",
      }));

    if (validatedQuestions.length === 0) {
      return NextResponse.json(
        {
          error: "Quiz questions were incomplete or malformed. Please retry generation.",
          isParseError: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions: validatedQuestions });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[/api/quiz Error]:", err);

    if (error instanceof GeminiApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to generate quiz from study material." },
      { status: 500 }
    );
  }
}
