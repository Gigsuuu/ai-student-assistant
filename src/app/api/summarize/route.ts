import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { NextRequest, NextResponse } from "next/server";
import {
  GeminiApiError,
  callGeminiDirect,
  cleanAndParseJSON,
  truncateDocument,
} from "@/lib/gemini";
import { SummaryData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/summarize
 * Generates structured Key Concepts, Bullet Takeaways, and Important Definitions.
 * Uses IPv4 first DNS order, clean generationConfig, and 30-second AbortController timeout.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Study material cannot be empty. Please provide notes or upload a document." },
        { status: 400 }
      );
    }

    const { text } = body;

    if (text.trim().length < 40) {
      return NextResponse.json(
        { error: "Study text is too short to generate a meaningful summary. Please provide more content." },
        { status: 400 }
      );
    }

    // Truncate document text to 12,000 characters max before building prompt
    const truncatedText = truncateDocument(text, 12000);

    const prompt = `
You are an expert Computer Engineering professor and academic tutor.
Analyze the following lecture notes and study material, and generate a concise, high-yield study summary.

You MUST respond strictly with a valid JSON object matching this TypeScript interface:
{
  "keyConcepts": [
    {
      "title": "Concise concept name",
      "description": "1-2 sentence technical explanation"
    }
  ],
  "bulletTakeaways": [
    "High-yield takeaway bullet point"
  ],
  "importantDefinitions": [
    {
      "term": "Technical Term / Theorem / Algorithm",
      "definition": "Precise academic definition"
    }
  ]
}

Ensure:
- 3 to 4 key concepts highlighting fundamental principles.
- 4 to 6 bullet takeaways capturing actionable exam points and trade-offs.
- 3 to 6 critical technical definitions from the material.
- Keep definitions crisp and stay within token output limits.

STUDY MATERIAL:
${truncatedText}
`;

    // Direct fetch with clean generationConfig and 30-second AbortController timeout
    const responseText = await callGeminiDirect({
      prompt,
      responseMimeType: "application/json",
      timeoutMs: 30000,
    });

    let parsedSummary: SummaryData;
    try {
      parsedSummary = cleanAndParseJSON<SummaryData>(responseText);
    } catch (parseErr) {
      console.error("[/api/summarize] JSON parse failed on text:", responseText.slice(0, 300), parseErr);
      return NextResponse.json(
        {
          error: "AI response contained invalid or malformed JSON formatting. Please retry generation.",
          isParseError: true,
        },
        { status: 502 }
      );
    }

    if (
      !parsedSummary ||
      !Array.isArray(parsedSummary.keyConcepts) ||
      !Array.isArray(parsedSummary.bulletTakeaways) ||
      !Array.isArray(parsedSummary.importantDefinitions)
    ) {
      return NextResponse.json(
        {
          error: "Summary data returned by AI was incomplete or malformed. Please retry generation.",
          isParseError: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary: parsedSummary });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[/api/summarize Error]:", err);

    if (error instanceof GeminiApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to generate summary from study material." },
      { status: 500 }
    );
  }
}
