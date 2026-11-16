import dns from "node:dns";

// Force IPv4 first DNS resolution to resolve Windows IPv6 connection hangs to Google APIs
dns.setDefaultResultOrder("ipv4first");

/**
 * Direct Gemini REST API helper utilities with automatic model fallback and retry logic.
 * Fallback chain: gemini-3.5-flash-lite -> gemini-3.6-flash -> gemini-3.8-flash
 */

export const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
] as const;

export const MAX_DOCUMENT_CHARS = 12000;

export class GeminiApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Truncates incoming document text to 12,000 characters max before building the prompt.
 */
export function truncateDocument(text: string, maxChars: number = MAX_DOCUMENT_CHARS): string {
  if (!text) return "";
  return text.trim().slice(0, maxChars);
}

export interface DirectGeminiOptions {
  prompt: string;
  responseMimeType?: string;
  timeoutMs?: number; // per-attempt timeout, default: 15000 (15s)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls Gemini REST API with automatic multi-model failover and transient retry logic:
 * 1. Tries models in order: gemini-3.5-flash-lite -> gemini-3.6-flash -> gemini-3.8-flash
 * 2. Retries transient 503/429 errors up to 2 times with exponential backoff & jitter (~1s, ~2s)
 * 3. Enforces maxOutputTokens: 1024 and 15s per-attempt timeout
 */
export async function callGeminiDirect({
  prompt,
  responseMimeType,
  timeoutMs = 15000,
}: DirectGeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.error("Gemini Error: Missing GEMINI_API_KEY in process.env. Please check your .env.local file.");
    throw new GeminiApiError(
      "GEMINI_API_KEY is not defined. Please add your Gemini API key to .env.local",
      500
    );
  }

  let lastError: GeminiApiError | null = null;

  for (const model of FALLBACK_MODELS) {
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff with jitter: attempt 1 = ~1s, attempt 2 = ~2s
        const backoffMs = attempt * 1000 + Math.floor(Math.random() * 400);
        console.warn(
          `[Gemini Retry] Model ${model} returned transient error. Backing off ${backoffMs}ms before attempt ${attempt + 1}...`
        );
        await sleep(backoffMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const generationConfig: Record<string, unknown> = {
          maxOutputTokens: 1024,
        };

        if (responseMimeType) {
          generationConfig.responseMimeType = responseMimeType;
        }

        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          let errorJson: Record<string, unknown> | null = null;
          let errorMessage = `Google API (${model}) returned status ${res.status}: ${res.statusText}`;

          try {
            errorJson = (await res.json()) as Record<string, unknown>;
            const innerError = errorJson?.error as { message?: string } | undefined;
            if (innerError?.message) {
              errorMessage = innerError.message;
            }
          } catch {
            // Fallback to HTTP status text
          }

          console.error(`=== Gemini API Error [${model}] (Attempt ${attempt + 1}) ===`);
          console.error(`Status: ${res.status} (${res.statusText})`);
          console.error("Full Error Body:", JSON.stringify(errorJson || errorMessage, null, 2));

          const apiErr = new GeminiApiError(errorMessage, res.status, errorJson);
          lastError = apiErr;

          // If transient error (503 Service Unavailable or 429 Too Many Requests / High Demand)
          if (res.status === 503 || res.status === 429) {
            if (attempt < maxRetries) {
              continue; // Retry this model
            } else {
              console.warn(
                `[Gemini Fallback] Model ${model} exhausted retries (HTTP ${res.status}). Switching to next model in fallback list...`
              );
              break; // Switch to next model
            }
          }

          // For permanent client errors (e.g. 400 invalid argument or 401 unauthenticated), do not cycle futilely
          throw apiErr;
        }

        const data = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText || typeof candidateText !== "string") {
          console.error(`Gemini API Error [${model}]: No candidate text found:`, JSON.stringify(data, null, 2));
          throw new GeminiApiError("No candidate text returned by Gemini API.", 502, data);
        }

        return candidateText;
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError" || controller.signal.aborted) {
          console.error(`Gemini API Error [${model}]: Request timed out after ${timeoutMs / 1000}s.`);
          lastError = new GeminiApiError(
            `Gemini API (${model}) timed out after ${timeoutMs / 1000}s.`,
            504
          );
          // Try next model if timed out
          break;
        }

        if (err instanceof GeminiApiError) {
          if (err.status !== 503 && err.status !== 429) {
            throw err;
          }
        } else {
          lastError = new GeminiApiError((err as Error).message, 500);
          break;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // If all models in the fallback list fail
  throw lastError || new GeminiApiError("All Gemini fallback models failed. Please try again shortly.", 503);
}

/**
 * Helper to safely extract and parse JSON from a Gemini response string.
 * Strips out markdown code fences (```json ... ```), extracts valid JSON object/array
 * boundaries, and handles common formatting quirks like trailing commas.
 */
export function cleanAndParseJSON<T>(rawText: string): T {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Cannot parse JSON from empty or invalid response string.");
  }

  let cleaned = rawText.trim().replace(/^\uFEFF/, "");

  // 1. Extract JSON from within Markdown code blocks (e.g. ```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    cleaned = cleaned.trim();
  }

  // 2. If preamble or trailing narrative text exists, slice to outer JSON boundaries { ... } or [ ... ]
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const endIdx = Math.max(lastBrace, lastBracket);

  if (startIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  // 3. Attempt first-pass parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr: unknown) {
    // 4. Secondary attempt: Sanitize common LLM quirks like trailing commas before closing braces/brackets
    try {
      const sanitized = cleaned.replace(/,\s*([\]}])/g, "$1");
      return JSON.parse(sanitized) as T;
    } catch {
      const error = initialErr as Error;
      console.error("Failed to parse JSON from Gemini response:", cleaned.slice(0, 300));
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }
}
