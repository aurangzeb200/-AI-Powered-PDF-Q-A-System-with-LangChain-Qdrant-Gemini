import { motion } from "framer-motion";
import { Send, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const suggestions = [
    "Summarize the key findings from the uploaded documents",
    "What are the main topics discussed in the research papers?",
    "Create a comparison between the different methodologies",
    "Extract all statistical data mentioned in the documents"
  ];

  return (
    <div className="relative">
      {/* Suggestions */}
      {!message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-4 left-0 right-0 pointer-events-none"
        >
          <div className="flex flex-wrap gap-2 justify-center max-w-full overflow-hidden">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMessage(suggestion)}
                className="glass-card px-3 py-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors border border-border/30 hover:border-primary/30 pointer-events-auto flex-shrink-0 max-w-[280px] truncate"
              >
                <Sparkles className="h-3 w-3 inline mr-1 flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="relative"
      >
        <div className="glass-card border border-border/50 rounded-2xl p-4 focus-within:border-primary/50 transition-colors">
          <div className="flex items-end gap-3">
            {/* Attachment Button */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Message Input */}
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your documents..."
                className="resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[24px] max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                rows={1}
              />
            </div>

            {/* Send Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="h-9 w-9 p-0 gradient-primary shadow-glow disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Character count */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-6 right-0 text-xs text-muted-foreground"
          >
            {message.length}/2000
          </motion.div>
        )}
      </motion.form>
    </div>
  );
};