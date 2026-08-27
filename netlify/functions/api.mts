import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import PDFParser from "pdf2json";

interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  pages: number;
  chunks: number;
  status: "indexed";
  created_at: string;
}

interface StoredDocument {
  document: DocumentRecord;
  text: string;
}

interface Source {
  id: string;
  title: string;
  page: number;
  confidence: number;
}

interface ChatBody {
  query?: string;
  document_id?: string | null;
}

declare const Netlify: { env: { get(name: string): string | undefined } };

function env(name: string) {
  return Netlify.env.get(name) ?? "";
}

function store() {
  return getStore("rag-demo-documents");
}

async function readDocuments(): Promise<DocumentRecord[]> {
  return (await store().get("documents.json", { type: "json" })) as DocumentRecord[] ?? [];
}

async function writeDocuments(documents: DocumentRecord[]) {
  await store().setJSON("documents.json", documents);
}

function extractPdf(bytes: ArrayBuffer): Promise<{ text: string; pages: number }> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true);
    parser.on("pdfParser_dataError", (error: { parserError?: Error | string }) => {
      reject(error.parserError ?? new Error("Unable to parse PDF."));
    });
    parser.on("pdfParser_dataReady", (data: { Pages?: unknown[] }) => {
      resolve({ text: parser.getRawTextContent(), pages: data.Pages?.length || 1 });
    });
    parser.parseBuffer(Buffer.from(bytes));
  });
}

function makeChunks(text: string, size = 1100, overlap = 150) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let start = 0; start < normalized.length; start += size - overlap) {
    chunks.push(normalized.slice(start, start + size));
    if (start + size >= normalized.length) break;
  }
  return chunks;
}

function terms(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

function rankChunks(query: string, text: string) {
  const queryTerms = terms(query);
  return makeChunks(text)
    .map((chunk, index) => {
      const chunkTerms = terms(chunk);
      const overlap = [...queryTerms].filter((term) => chunkTerms.has(term)).length;
      return { chunk, index, score: overlap / Math.max(1, queryTerms.size) };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export default async function handler(req: Request, context: Context) {
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const segments = route.split("/").filter(Boolean);

  if (req.method === "GET" && route === "health") {
    const documents = await readDocuments();
    return json({ status: "ok", service: "rag-demo-netlify", ready: Boolean(env("GOOGLE_API_KEY")), documents: documents.length });
  }

  if (req.method === "GET" && route === "documents") {
    return json(await readDocuments());
  }

  if (req.method === "POST" && route === "upload") {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf")) {
      return json({ detail: "Only PDF files are supported." }, 400);
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return json({ detail: "PDF exceeds the 10 MB upload limit." }, 413);
    }
    const parsed = await extractPdf(bytes);
    const text = parsed.text.replace(/\s+/g, " ").trim();
    if (!text) return json({ detail: "The PDF does not contain extractable text." }, 422);

    const id = crypto.randomUUID().slice(0, 12);
    const document: DocumentRecord = {
      id,
      name: file.name,
      size: bytes.byteLength,
      pages: parsed.pages,
      chunks: makeChunks(text).length,
      status: "indexed",
      created_at: new Date().toISOString(),
    };
    await store().setJSON(`document:${id}`, { document, text } satisfies StoredDocument);
    await writeDocuments([document, ...(await readDocuments())]);
    return json(document, 201);
  }

  if (req.method === "DELETE" && segments[0] === "documents" && segments[1]) {
    const id = segments[1];
    const documents = await readDocuments();
    if (!documents.some((document) => document.id === id)) return json({ detail: "Document not found." }, 404);
    await store().delete(`document:${id}`);
    await writeDocuments(documents.filter((document) => document.id !== id));
    return new Response(null, { status: 204 });
  }

  if (req.method === "POST" && route === "chat") {
    const body = (await req.json()) as ChatBody;
    const query = body.query?.trim() ?? "";
    if (!query) return json({ detail: "Question cannot be empty." }, 400);
    const documents = await readDocuments();
    if (!documents.length) return json({ detail: "Upload a PDF before asking a question." }, 400);
    const selected = body.document_id ? documents.filter((document) => document.id === body.document_id) : documents;
    if (body.document_id && !selected.length) return json({ detail: "Selected document not found." }, 404);

    const retrieved = [] as Array<{ chunk: string; score: number; document: DocumentRecord; index: number }>;
    for (const document of selected) {
      const saved = (await store().get(`document:${document.id}`, { type: "json" })) as StoredDocument | null;
      if (!saved) continue;
      for (const item of rankChunks(query, saved.text)) retrieved.push({ ...item, document });
    }
    retrieved.sort((left, right) => right.score - left.score);
    const best = retrieved.slice(0, 5);
    if (!best.length) return json({ text: "I could not find relevant text in the indexed documents.", sources: [] });

    const sources: Source[] = best.map((item) => ({ id: `${item.document.id}-${item.index}`, title: item.document.name, page: 1, confidence: Math.max(0.1, Math.min(1, item.score)) }));
    const contextText = best.map((item) => `[${item.document.name}]\n${item.chunk}`).join("\n\n");
    const apiKey = env("GOOGLE_API_KEY");
    if (!apiKey) return json({ detail: "GOOGLE_API_KEY is not configured in Netlify." }, 503);

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: env("GEMINI_MODEL") || "gemini-2.5-flash" });
    const result = await model.generateContent(`Answer using only the supplied PDF context. If it is insufficient, say so clearly. Keep the answer concise and mention the document name when useful.\n\nContext:\n${contextText}\n\nQuestion: ${query}`);
    return json({ text: result.response.text().trim(), sources });
  }

  return json({ detail: "Route not found." }, 404);
}

export const config: Config = { path: "/api/*" };
