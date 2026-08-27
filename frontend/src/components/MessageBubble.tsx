import { Bot, Check, Copy, FileText, UserRound } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Source } from "../api";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Source[];
}

export function MessageBubble({ content, isUser, timestamp, sources = [] }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-avatar" aria-hidden="true">{isUser ? <UserRound size={16} /> : <Bot size={17} />}</div>
      <div className="message-content">
        <div className="message-label">{isUser ? "You" : "Papertrail"}</div>
        <div className="message-card">
          <div className="markdown-body"><ReactMarkdown>{content}</ReactMarkdown></div>
          {!isUser && (
            <div className="message-tools">
              <span>{timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <div className="message-actions">
                {sources.length > 0 && <button onClick={() => setShowSources(!showSources)} className="text-button">{showSources ? "Hide sources" : `${sources.length} source${sources.length === 1 ? "" : "s"}`}</button>}
                <button onClick={copyAnswer} className="copy-button" aria-label="Copy answer">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
              </div>
            </div>
          )}
        </div>
        {!isUser && showSources && sources.length > 0 && (
          <div className="source-list">
            {sources.map((source) => (
              <div className="source-item" key={source.id}>
                <FileText size={14} />
                <span>{source.title}{source.page ? ` · page ${source.page}` : ""}</span>
                <b>{Math.round(source.confidence * 100)}%</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
