import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/parse-pdf
 * Extracts plain text from an uploaded PDF document using pdf-parse on the server.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was uploaded. Please attach a .pdf file." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF documents are supported by this endpoint." },
        { status: 400 }
      );
    }

    // Convert file to Node.js Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the PDF
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "The uploaded PDF contains no extractable text. It may consist of scanned images or protected content.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("PDF Parsing error:", err);
    return NextResponse.json(
      { error: `PDF extraction failed: ${err.message}` },
      { status: 500 }
    );
  }
}
