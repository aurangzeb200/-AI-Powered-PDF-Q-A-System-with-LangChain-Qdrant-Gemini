import { FileSearch, Menu, Server } from "lucide-react";

interface BrandHeaderProps {
  backendOnline: boolean;
  onOpenDocuments: () => void;
}

export function BrandHeader({ backendOnline, onOpenDocuments }: BrandHeaderProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup" aria-label="Papertrail home">
        <span className="brand-mark" aria-hidden="true"><FileSearch size={18} strokeWidth={2.2} /></span>
        <span>
          <strong>Papertrail</strong>
          <small>Document intelligence</small>
        </span>
      </div>
      <div className="topbar-actions">
        <span className={`status-chip ${backendOnline ? "is-online" : "is-offline"}`}>
          <Server size={14} aria-hidden="true" />
          {backendOnline ? "API connected" : "API offline"}
        </span>
        <button className="icon-button mobile-documents-button" onClick={onOpenDocuments} aria-label="Open documents">
          <Menu size={19} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
