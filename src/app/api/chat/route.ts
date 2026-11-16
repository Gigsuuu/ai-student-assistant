import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { NextRequest, NextResponse } from "next/server";
import {
  GeminiApiError,
  callGeminiDirect,
  truncateDocument,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  message: string;
  context: string;
  history?: {
    role: "user" | "assistant";
    content: string;
  }[];
}

/**
 * POST /api/chat
 * Context-grounded Academic Q&A Chatbot.
 * Uses IPv4 first DNS order and 30-second AbortController timeout.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json().catch(() => null);

    if (!body || !body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: "Question message cannot be empty." },
        { status: 400 }
      );
    }

    if (!body.context || typeof body.context !== "string" || body.context.trim().length === 0) {
      return NextResponse.json(
        { error: "No study material provided. Please upload or paste lecture notes first." },
        { status: 400 }
      );
    }

    const { message, context, history = [] } = body;

    // Truncate document context to 12,000 characters max before building prompt
    const truncatedContext = truncateDocument(context, 12000);

    // Bound conversation history to last 10 messages max to prevent payload overflow
    const recentHistory = (Array.isArray(history) ? history : []).slice(-10);

    let prompt = `You are an expert, encouraging Academic Teaching Assistant for Computer Engineering students.
Your mission is to help the student understand and master the specific lecture material provided in the STUDY CONTEXT.

STRICT GROUNDING RULES:
1. Ground your answers strictly in the provided STUDY CONTEXT.
2. If the user asks a question whose answer cannot be determined or inferred from the provided context, politely inform them:
   "Based on the provided study material, this question is not covered in your notes. However, from the notes we know that [mention closest related concept if applicable]."
3. Explain formulas, algorithms, and concepts clearly and concisely (within 1-3 short paragraphs).
4. Format your responses with clean Markdown (bullet points, bold technical terms, and code snippets where appropriate).
5. Maintain a professional, supportive academic tone suitable for engineering exams.

STUDY CONTEXT:
${truncatedContext}

`;

    if (recentHistory.length > 0) {
      prompt += `CONVERSATION HISTORY (Last ${recentHistory.length} turns):\n`;
      recentHistory.forEach((msg) => {
        // Guard individual message content to 1,000 chars max
        const cleanContent = typeof msg.content === "string" ? msg.content.slice(0, 1000).trim() : "";
        prompt += `${msg.role === "user" ? "Student" : "TA Assistant"}: ${cleanContent}\n`;
      });
      prompt += `\n`;
    }

    prompt += `Student: ${message.trim()}\nTA Assistant:`;

    // Direct fetch with clean generationConfig and 30-second AbortController timeout
    const reply = await callGeminiDirect({
      prompt,
      timeoutMs: 30000,
    });

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[/api/chat Error]:", err);

    if (error instanceof GeminiApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to process chat question." },
      { status: 500 }
    );
  }
}
