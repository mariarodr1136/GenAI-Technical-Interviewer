/** Matches MAX_RESUME_CHARS on the server — keep the two in sync. */
export const MAX_RESUME_CHARS = 1200;

/**
 * PDF text extraction is jagged: absolute-positioned fragments, hyphenation,
 * repeated whitespace. Collapse it into something readable that fits the cap.
 */
export function normalizeResumeText(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim()
    .slice(0, MAX_RESUME_CHARS);
}

/**
 * Extracts text from a PDF entirely in the browser — the file itself never
 * leaves the machine; only the extracted text is sent with interview turns.
 * pdf.js is imported lazily so it stays out of the main bundle.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    const doc = await loadingTask.promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return normalizeResumeText(pages.join("\n"));
  } finally {
    await loadingTask.destroy();
  }
}

/** Reads a resume from an uploaded file: PDFs are parsed, everything else is read as text. */
export async function extractResumeText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractPdfText(file);
  }
  return normalizeResumeText(await file.text());
}
