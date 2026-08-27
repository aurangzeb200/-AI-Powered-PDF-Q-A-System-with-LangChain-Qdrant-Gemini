import { API_URL } from "./config";

const API_PREFIX = API_URL ? "" : "/api";
const endpoint = (path: string) => `${API_URL}${API_PREFIX}${path}`;

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  pages: number;
  chunks: number;
  status: "indexed" | "processing" | "error" | string;
  created_at: string;
}

export interface Source {
  id: string;
  title: string;
  page?: number | null;
  confidence: number;
}

export interface ChatResponse {
  text: string;
  sources: Source[];
}

interface HealthResponse {
  status: string;
  ready?: boolean;
  gemini_configured?: boolean;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof body === "object" && body && "detail" in body ? body.detail : body;
    throw new Error(String(detail || `Request failed with status ${response.status}`));
  }
  return body as T;
}

export async function checkBackend(): Promise<HealthResponse> {
  const response = await fetch(endpoint("/health"), { headers: { Accept: "application/json" } });
  return parseResponse<HealthResponse>(response);
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const response = await fetch(endpoint("/documents"), { headers: { Accept: "application/json" } });
  return parseResponse<DocumentRecord[]>(response);
}

export async function uploadDocument(file: File): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(endpoint("/upload"), { method: "POST", body: formData });
  return parseResponse<DocumentRecord>(response);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(endpoint(`/documents/${encodeURIComponent(documentId)}`), { method: "DELETE" });
  await parseResponse<unknown>(response);
}

export async function sendMessage(query: string, documentId?: string): Promise<ChatResponse> {
  const response = await fetch(endpoint("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, document_id: documentId || null }),
  });
  return parseResponse<ChatResponse>(response);
}
