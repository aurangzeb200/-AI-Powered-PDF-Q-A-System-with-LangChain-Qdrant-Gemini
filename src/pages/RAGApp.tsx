// src/pages/RAGApp.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { sendMessage, BackendResponse, Source } from "../api";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  sources?: Source[];
  timestamp: Date;
}

export const RAGApp = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI assistant. I can help you analyze and understand your documents. Upload some files and ask me anything about them!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response: BackendResponse = await sendMessage(content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        isUser: false,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "⚠️ Failed to get response from backend.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
      <div className="relative z-10">
        <Header />
        <div className="flex h-[calc(100vh-80px)]">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex items-center justify-center p-8"
              >
                <div className="text-center max-w-2xl">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="relative mb-8"
                  >
                    <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 animate-glow"></div>
                    <div className="relative gradient-primary p-8 rounded-3xl shadow-elegant">
                      <Sparkles className="h-16 w-16 text-white mx-auto" />
                    </div>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-4xl font-heading font-bold text-foreground mb-4"
                  >
                    Welcome to RAG Assistant
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-xl text-muted-foreground mb-8"
                  >
                    Upload your documents and ask questions to get intelligent, source-backed answers
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex gap-4 justify-center"
                  >
                    <Button
                      onClick={() => setSidebarOpen(true)}
                      className="gradient-primary shadow-glow hover:shadow-elegant transition-all"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Chat Messages */}
            {messages.length > 1 && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto py-8">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        id={message.id}
                        content={message.content}
                        isUser={message.isUser}
                        sources={message.sources}
                        timestamp={message.timestamp}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start p-6">
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 gradient-primary rounded-full blur opacity-30"></div>
                          <div className="relative glass-card p-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="h-5 w-5 text-primary" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="glass-card p-6 bg-card/50 border-border/50">
                          <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-primary rounded-full"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-6 border-t border-border/30">
              <div className="max-w-4xl mx-auto">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>
          </div>

          {/* Document Sidebar */}
          <DocumentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Floating Action Button for Documents */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-24 right-6 z-30"
        >
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`h-12 w-12 rounded-full transition-all ${
              sidebarOpen ? "bg-destructive hover:bg-destructive/90 shadow-lg" : "gradient-primary shadow-glow hover:shadow-elegant"
            }`}
          >
            {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
