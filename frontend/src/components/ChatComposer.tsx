import { ArrowUp, LoaderCircle, Paperclip } from "lucide-react";
import { FormEvent, useState } from "react";

interface ChatComposerProps {
  disabled?: boolean;
  isLoading?: boolean;
  selectedDocumentName?: string;
  onSubmit: (message: string) => void;
}

export function ChatComposer({ disabled = false, isLoading = false, selectedDocumentName, onSubmit }: ChatComposerProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = value.trim();
    if (!message || disabled || isLoading) return;
    onSubmit(message);
    setValue("");
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-context">
        <Paperclip size={14} />
        <span>{selectedDocumentName ? `Grounded in ${selectedDocumentName}` : "Select a document to ground your answer"}</span>
      </div>
      <div className="composer-row">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={disabled ? "Upload and select a PDF to begin" : "Ask a question about your document…"}
          rows={1}
          disabled={disabled || isLoading}
          aria-label="Ask a question"
        />
        <button className="send-button" type="submit" disabled={disabled || isLoading || !value.trim()} aria-label="Send question">
          {isLoading ? <LoaderCircle size={18} className="spin" /> : <ArrowUp size={18} />}
        </button>
      </div>
      <p className="composer-hint">Press Enter to send · Shift + Enter for a new line</p>
    </form>
  );
}
