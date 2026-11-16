import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { NextRequest, NextResponse } from "next/server";
import {
  GeminiApiError,
  callGeminiDirect,
  cleanAndParseJSON,
  truncateDocument,
} from "@/lib/gemini";
import { FlashcardItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FlashcardResponseWrapper {
  flashcards: FlashcardItem[];
}

/**
 * POST /api/flashcards
 * Generates 6 to 8 interactive flashcards with front (term/concept) and back (definition/formula).
 * Uses IPv4 first DNS order and 30-second AbortController timeout.
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
        { error: "Study text is too short to generate flashcards. Please provide more content." },
        { status: 400 }
      );
    }

    // Truncate document text to 8,000 characters max before building prompt
    const truncatedText = truncateDocument(text, 8000);

    const prompt = `
You are an engineering tutor creating digital revision flashcards.
Analyze the following study material and generate between 6 and 8 high-yield flashcards.

You MUST respond strictly with a valid JSON object matching this TypeScript interface:
{
  "flashcards": [
    {
      "id": 1,
      "term": "Term, Concept, or Architectural Component (Front of card)",
      "definition": "Crisp definition, formula, or breakdown (Back of card, 1-2 sentences)",
      "category": "Topic tag (e.g., Memory, Kernel, Architecture)"
    }
  ]
}

Guidelines:
- Generate 6 to 8 flashcards.
- Front: Short and focused.
- Back: High-density, concise technical summary (1-2 sentences).
- Keep descriptions within token limits.

STUDY MATERIAL:
${truncatedText}
`;

    // Direct fetch with clean generationConfig and 30-second AbortController timeout
    const responseText = await callGeminiDirect({
      prompt,
      responseMimeType: "application/json",
      timeoutMs: 30000,
    });

    const parsedData = cleanAndParseJSON<FlashcardResponseWrapper>(responseText);

    if (!parsedData.flashcards || !Array.isArray(parsedData.flashcards)) {
      throw new Error("Invalid response schema: 'flashcards' array missing.");
    }

    return NextResponse.json({ flashcards: parsedData.flashcards });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[/api/flashcards Error]:", err);

    if (error instanceof GeminiApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to generate flashcards from study material." },
      { status: 500 }
    );
  }
}
