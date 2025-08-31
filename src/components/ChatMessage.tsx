import { motion } from "framer-motion";
import { User, Bot, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

interface Source {
  id: string;
  title: string;
  page?: number;
  confidence: number;
}

interface ChatMessageProps {
  id: string;
  content: string;
  isUser: boolean;
  sources?: Source[];
  timestamp: Date;
}

export const ChatMessage = ({ content, isUser, sources, timestamp }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-4 p-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 gradient-primary rounded-full blur opacity-30"></div>
          <div className="relative glass-card p-2">
            <Bot className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'order-2' : ''}`}>
        <div
          className={`glass-card p-6 ${
            isUser
              ? 'gradient-primary text-white ml-12'
              : 'bg-card/50 border-border/50'
          } hover-lift transition-all duration-200`}
        >
          {/* Message */}
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  return !isInline ? (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg !mt-4 !mb-4"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className={`${className} bg-muted/20 px-1.5 py-0.5 rounded text-sm`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Action Buttons */}
          {!isUser && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                {sources && sources.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSources(!showSources)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Sources ({sources.length})
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && showSources && sources && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-2"
          >
            {sources.map((source) => (
              <motion.div
                key={source.id}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-3 cursor-pointer border border-border/30 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{source.title}</p>
                    {source.page && (
                      <p className="text-xs text-muted-foreground">Page {source.page}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(source.confidence * 100)}%
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="glass-card p-2 bg-secondary/20">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}
    </motion.div>
  );
};