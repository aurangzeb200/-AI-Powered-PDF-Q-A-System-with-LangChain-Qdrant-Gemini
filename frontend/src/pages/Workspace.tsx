import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, FilePlus2, Library, RefreshCw } from "lucide-react";
import { BrandHeader } from "../components/BrandHeader";
import { ChatComposer } from "../components/ChatComposer";
import { DocumentPanel } from "../components/DocumentPanel";
import { MessageBubble } from "../components/MessageBubble";
import { checkBackend, deleteDocument, listDocuments, sendMessage, uploadDocument, type DocumentRecord, type Source } from "../api";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Source[];
}

type BackendState = "checking" | "online" | "offline";

const initialMessage: Message = {
  id: "welcome",
  content: "Upload a PDF and I’ll help you find the important details, explain unfamiliar sections, and answer questions with page-level sources.",
  isUser: false,
  timestamp: new Date(),
};

export default function Workspace() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [backendState, setBackendState] = useState<BackendState>("checking");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId],
  );

  async function loadWorkspace() {
    setBackendState("checking");
    setError("");
    try {
      const health = await checkBackend();
      setBackendState(health.status === "ok" ? "online" : "offline");
      const items = await listDocuments();
      setDocuments(items);
      setSelectedDocumentId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id);
    } catch (cause) {
      setBackendState("offline");
      setError(cause instanceof Error ? cause.message : "The API is not reachable.");
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setIsUploading(true);
    setError("");
    try {
      const document = await uploadDocument(file);
      setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
      setSelectedDocumentId(document.id);
      setIsPanelOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The PDF could not be indexed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(documentId: string) {
    const document = documents.find((item) => item.id === documentId);
    if (!document || !window.confirm(`Delete ${document.name}?`)) return;
    try {
      await deleteDocument(documentId);
      const remaining = documents.filter((item) => item.id !== documentId);
      setDocuments(remaining);
      setSelectedDocumentId((current) => current === documentId ? remaining[0]?.id : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The document could not be deleted.");
    }
  }

  async function handleQuestion(content: string) {
    setError("");
    setMessages((current) => [...current, { id: `${Date.now()}-user`, content, isUser: true, timestamp: new Date() }]);
    setIsLoading(true);
    try {
      const response = await sendMessage(content, selectedDocumentId);
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, content: response.text, isUser: false, timestamp: new Date(), sources: response.sources }]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The answer could not be generated.";
      setMessages((current) => [...current, { id: `${Date.now()}-error`, content: `I couldn’t complete that request. ${message}`, isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }

  const showSetupState = documents.length === 0;

  return (
    <div className="app-shell">
      <BrandHeader backendOnline={backendState === "online"} onOpenDocuments={() => setIsPanelOpen(true)} />
      <div className="workspace-layout">
        <DocumentPanel
          documents={documents}
          selectedDocumentId={selectedDocumentId}
          isOpen={isPanelOpen}
          isUploading={isUploading}
          onClose={() => setIsPanelOpen(false)}
          onOpenFilePicker={() => fileInputRef.current?.click()}
          onSelect={(id) => { setSelectedDocumentId(id); setIsPanelOpen(false); }}
          onDelete={handleDelete}
        />
        <main className="chat-workspace">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">Workspace</p>
              <h1>Ask your documents.</h1>
              <p className="heading-copy">A focused place to read, retrieve, and understand your PDF knowledge base.</p>
            </div>
            <button className="secondary-button" onClick={() => setIsPanelOpen(true)}><Library size={16} /> Manage library</button>
          </div>

          {backendState === "offline" && (
            <div className="notice notice-warning"><span><span className="notice-title">Backend unavailable.</span> Start the FastAPI service on port 8000 to upload and ask questions.</span><button className="text-button" onClick={() => void loadWorkspace()}><RefreshCw size={14} /> Retry</button></div>
          )}
          {error && backendState !== "offline" && <div className="notice notice-error">{error}</div>}

          <div className="chat-surface">
            {showSetupState ? (
              <section className="empty-workspace">
                <div className="empty-icon"><BookOpen size={26} /></div>
                <p className="eyebrow">Start with a source</p>
                <h2>Your answers should have somewhere to begin.</h2>
                <p>Upload a PDF to build a searchable knowledge base. Once it’s indexed, ask a question below and the assistant will cite the relevant pages.</p>
                <button className="primary-button" onClick={() => fileInputRef.current?.click()} disabled={backendState !== "online" || isUploading}><FilePlus2 size={17} /> {isUploading ? "Indexing…" : "Upload a PDF"}</button>
                <div className="capability-list"><span><CheckCircle2 size={15} /> Local vector search</span><span><CheckCircle2 size={15} /> Source-backed answers</span></div>
              </section>
            ) : (
              <div className="messages" aria-live="polite">
                {messages.map((message) => <MessageBubble key={message.id} {...message} />)}
                {isLoading && <div className="thinking"><span className="thinking-dots"><i /><i /><i /></span> Reading your source…</div>}
              </div>
            )}
            <div className="composer-wrap">
              <ChatComposer disabled={backendState !== "online" || documents.length === 0} isLoading={isLoading} selectedDocumentName={selectedDocument?.name} onSubmit={handleQuestion} />
            </div>
          </div>
          <p className="privacy-note">Your documents stay in the backend’s configured data directory. Responses are generated from retrieved document context.</p>
        </main>
      </div>
      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="visually-hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); }} />
    </div>
  );
}
