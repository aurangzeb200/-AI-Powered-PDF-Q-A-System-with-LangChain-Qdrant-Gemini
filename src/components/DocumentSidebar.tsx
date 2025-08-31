import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  File, 
  Trash2, 
  Download,
  X,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadProgress?: number;
  isProcessing?: boolean;
  pages?: number;
}

interface DocumentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSidebar = ({ isOpen, onClose }: DocumentSidebarProps) => {
  const [documents, setDocuments] = useState<Document[]>([
  ]);
  
  const [uploading, setUploading] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newDoc: Document = {
        id,
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: file.size / (1024 * 1024), // Convert to MB
        uploadProgress: 0,
        isProcessing: true
      };
      
      setDocuments(prev => [...prev, newDoc]);
      setUploading(prev => [...prev, id]);
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploading(prev => prev.filter(upId => upId !== id));
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === id 
                ? { ...doc, uploadProgress: 100, isProcessing: false }
                : doc
            )
          );
        } else {
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === id 
                ? { ...doc, uploadProgress: progress }
                : doc
            )
          );
        }
      }, 500);
    });
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const formatFileSize = (size: number) => {
    return size > 1 ? `${size.toFixed(1)} MB` : `${(size * 1024).toFixed(0)} KB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed right-0 top-0 h-full w-96 glass-card border-l border-border/50 z-60 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  Knowledge Base
                </h2>
                <p className="text-sm text-muted-foreground">
                  {documents.length} documents indexed
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="p-6 border-b border-border/30">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="gradient-primary p-3 rounded-full w-fit mx-auto mb-3">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Upload Documents
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, TXT up to 10MB
              </p>
            </motion.div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Uploaded Documents
            </h3>
            
            <AnimatePresence>
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card p-4 border border-border/30 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="gradient-secondary p-2 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.size)}
                            </span>
                            {doc.pages && (
                              <span className="text-xs text-muted-foreground">
                                {doc.pages} pages
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {doc.uploadProgress !== undefined && doc.uploadProgress < 100 && (
                        <div className="mt-2 space-y-1">
                          <Progress value={doc.uploadProgress} className="h-1" />
                          <p className="text-xs text-muted-foreground">
                            {doc.isProcessing ? 'Processing...' : 'Uploading...'} {Math.round(doc.uploadProgress)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};