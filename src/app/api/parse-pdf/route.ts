import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/parse-pdf
 * Extracts plain text from an uploaded PDF document using pdf-parse on the server.
 * Hardened against oversized files (>10MB), empty files, unsupported formats, and corrupted PDFs.
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

    // Format validation
    const lowerName = file.name ? file.name.toLowerCase() : "";
    if (!lowerName.endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `Unsupported file format (${file.name || "unknown"}). Only .pdf documents are supported by this endpoint.` },
        { status: 400 }
      );
    }

    // Empty file validation
    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded PDF file is empty (0 bytes). Please upload a valid document." },
        { status: 400 }
      );
    }

    // Oversized file validation (> 10 MB)
    if (file.size > MAX_PDF_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File size exceeds the 10 MB limit (${sizeMB} MB). Please upload a smaller document.` },
        { status: 413 }
      );
    }

    // Convert file to Node.js Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF magic bytes: standard PDFs begin with '%PDF-'
    if (buffer.length < 5 || buffer.toString("utf8", 0, 5) !== "%PDF-") {
      return NextResponse.json(
        { error: "The uploaded file does not appear to be a valid or intact PDF document." },
        { status: 422 }
      );
    }

    // Parse the PDF with error handling for corrupted/encrypted PDFs
    let data;
    try {
      data = await pdf(buffer);
    } catch (parseErr: unknown) {
      const err = parseErr as Error;
      console.error("pdf-parse extraction error:", err);
      return NextResponse.json(
        {
          error:
            "Unable to read this PDF document. The file may be corrupted, password-protected, or in an unsupported encoding.",
        },
        { status: 422 }
      );
    }

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "The uploaded PDF contains no extractable text. It may consist of scanned images or handwriting without searchable text.",
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
      { error: `PDF extraction failed: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
