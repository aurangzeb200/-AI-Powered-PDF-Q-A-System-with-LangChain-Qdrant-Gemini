import { FileText, LoaderCircle, Plus, Trash2, UploadCloud, X } from "lucide-react";
import type { DocumentRecord } from "../api";

interface DocumentPanelProps {
  documents: DocumentRecord[];
  selectedDocumentId?: string;
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onOpenFilePicker: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPanel({ documents, selectedDocumentId, isOpen, isUploading, onClose, onOpenFilePicker, onSelect, onDelete }: DocumentPanelProps) {
  return (
    <aside className={`document-panel ${isOpen ? "is-open" : ""}`} aria-label="Document library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Your documents</h2>
          <p className="panel-caption">Select a source to ground your next answer.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close document library"><X size={18} /></button>
      </div>

      <button className="upload-zone" onClick={onOpenFilePicker} disabled={isUploading}>
        <span className="upload-icon">{isUploading ? <LoaderCircle size={19} className="spin" /> : <UploadCloud size={19} />}</span>
        <span>
          <strong>{isUploading ? "Indexing document…" : "Add a PDF"}</strong>
          <small>PDF files up to 10 MB</small>
        </span>
        <Plus size={18} className="upload-plus" aria-hidden="true" />
      </button>

      <div className="document-list" aria-live="polite">
        {documents.length === 0 ? (
          <div className="empty-library">
            <FileText size={22} strokeWidth={1.5} />
            <p>No documents yet</p>
            <span>Your indexed PDFs will appear here.</span>
          </div>
        ) : (
          documents.map((document) => (
            <div key={document.id} className={`document-row ${selectedDocumentId === document.id ? "is-selected" : ""}`}>
              <button className="document-select" onClick={() => onSelect(document.id)} aria-pressed={selectedDocumentId === document.id}>
                <span className="file-icon"><FileText size={17} /></span>
                <span className="document-meta">
                  <strong title={document.name}>{document.name}</strong>
                  <small>{formatSize(document.size)} · {document.pages} {document.pages === 1 ? "page" : "pages"}</small>
                </span>
              </button>
              <button className="delete-button" onClick={() => onDelete(document.id)} aria-label={`Delete ${document.name}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="panel-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>{documents.length} indexed {documents.length === 1 ? "document" : "documents"}</span>
      </div>
    </aside>
  );
}
