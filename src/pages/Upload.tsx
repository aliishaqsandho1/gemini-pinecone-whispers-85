import React, { useCallback, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, Loader2, Trash2, MessageCircle, Mic, MicOff, Save, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseRAGService } from '@/lib/supabase-rag-service';
import { Document } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';

export const UploadPage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Partial<Document>[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  
  // Text input states
  const [textInput, setTextInput] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);
  
  // Speech input states
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const { toast } = useToast();

  // Load existing documents on component mount
  useEffect(() => {
    loadDocuments();
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsRecording(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setTextInput(prev => prev + ' ' + transcript);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        setIsRecording(false);
        toast({
          title: "Speech Recognition Error",
          description: "There was an error with speech recognition. Please try again.",
          variant: "destructive",
        });
      };

      setRecognition(recognitionInstance);
      setSpeechSupported(true);
    } else {
      setSpeechSupported(false);
    }
  };

  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSaveTextDocument = async () => {
    if (!textInput.trim()) {
      toast({
        title: "No content to save",
        description: "Please add some text content before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!documentTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your document.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingText(true);

    try {
      const success = await supabaseRAGService.storeDocument({
        title: documentTitle.trim(),
        content: textInput.trim(),
        file_path: null,
        file_type: 'text/plain'
      });

      if (success) {
        toast({
          title: "Document saved successfully",
          description: `"${documentTitle}" has been added to your knowledge base.`,
        });
        
        // Clear the form
        setTextInput('');
        setDocumentTitle('');
        
        // Reload documents list
        await loadDocuments();
      } else {
        throw new Error('Failed to save document');
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your document.",
        variant: "destructive",
      });
    } finally {
      setIsSavingText(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await supabaseRAGService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('📁 Starting file upload for', files.length, 'files');
    setIsUploading(true);

    try {
      for (const file of files) {
        console.log('📄 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        // Upload file to Supabase Storage
        const filePath = await supabaseRAGService.uploadFile(file);
        if (!filePath) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        // Read file content
        const content = await readFileContent(file);
        console.log('📝 File content length:', content.length);
        
        // Store document in database
        const success = await supabaseRAGService.storeDocument({
          title: file.name,
          content,
          file_path: filePath,
          file_type: file.type || 'text/plain'
        });

        if (!success) {
          throw new Error(`Failed to store ${file.name} in database`);
        }
        
        setUploadedFiles(prev => [...prev, file.name]);
      }

      toast({
        title: "Documents uploaded successfully",
        description: `${files.length} document(s) have been processed and stored in your personal knowledge base.`,
      });
      
      // Reload documents list
      await loadDocuments();
      
      console.log('🎉 All files uploaded successfully');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your documents.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  }, [toast]);

  const handleDeleteDocument = async (id: string, title: string) => {
    try {
      const success = await supabaseRAGService.deleteDocument(id);
      if (success) {
        toast({
          title: "Document deleted",
          description: `${title} has been removed from your knowledge base.`,
        });
        await loadDocuments();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the document.",
        variant: "destructive",
      });
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      return await readPDFContent(file);
    }
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      return await readDocxContent(file);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readPDFContent = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items as any[];
        const pageText = textItems.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error reading PDF:', error);
      throw new Error('Failed to read PDF content. Please try uploading a text file instead.');
    }
  };

  const readDocxContent = async (file: File): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error reading DOCX:', error);
      throw new Error('Failed to read Word document content. Please try uploading a text file instead.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ai-background via-white to-ai-muted/30">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Upload Section */}
        <Card className="p-8 bg-gradient-to-br from-white/80 to-ai-muted/50 backdrop-blur-sm border-ai-primary/20 shadow-card hover:shadow-elevated transition-all duration-300">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-ai-primary to-ai-secondary rounded-2xl flex items-center justify-center shadow-gentle">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                Upload Personal Documents
              </h3>
              <p className="text-muted-foreground">
                Add documents to your personal knowledge base for intelligent querying
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Select Files (PDF, DOCX, TXT, MD)
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ai-primary file:text-white hover:file:bg-ai-primary/90 transition-all"
              />
            </div>

            {isUploading && (
              <div className="flex items-center justify-center space-x-2 text-ai-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing and storing documents...</span>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Recently Uploaded:</h4>
                <div className="space-y-2">
                  {uploadedFiles.slice(-5).map((fileName, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm p-3 bg-white/60 rounded-lg border border-ai-primary/10">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <FileText className="w-4 h-4 text-ai-primary" />
                      <span className="text-foreground">{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Text & Speech Input Section */}
        <Card className="p-8 bg-gradient-to-br from-white/80 to-ai-muted/50 backdrop-blur-sm border-ai-primary/20 shadow-card hover:shadow-elevated transition-all duration-300">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-ai-secondary to-ai-accent rounded-2xl flex items-center justify-center shadow-gentle">
                <Type className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-ai-secondary to-ai-accent bg-clip-text text-transparent">
                Add Content by Text or Voice
              </h3>
              <p className="text-muted-foreground">
                Type or speak your content directly to add it to your knowledge base
              </p>
            </div>

            <div className="space-y-6">
              {/* Document Title Input */}
              <div className="space-y-2">
                <Label htmlFor="document-title" className="text-sm font-medium">
                  Document Title
                </Label>
                <Input
                  id="document-title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter a title for your document..."
                  className="border-ai-primary/20 focus:border-ai-primary focus:ring-ai-primary/20"
                  disabled={isSavingText}
                />
              </div>

              {/* Text Content Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="text-content" className="text-sm font-medium">
                    Content
                  </Label>
                  <div className="flex items-center space-x-2">
                    {speechSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleRecording}
                        disabled={isSavingText}
                        className={`${
                          isRecording 
                            ? 'border-red-400 text-red-600 hover:border-red-500 hover:text-red-700' 
                            : 'border-ai-primary/20 text-ai-primary hover:border-ai-primary'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Voice Input
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <Textarea
                    id="text-content"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isRecording ? "Listening... Your speech will appear here" : "Type your content here or use voice input..."}
                    className={`min-h-[200px] resize-y border-ai-primary/20 focus:border-ai-primary focus:ring-ai-primary/20 transition-all duration-200 ${
                      isRecording ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                    disabled={isSavingText}
                  />
                  
                  {isRecording && (
                    <div className="absolute top-3 right-3 flex items-center space-x-2 text-red-500 animate-fade-in">
                      <div className="flex space-x-1">
                        <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs font-medium">Recording</span>
                    </div>
                  )}
                </div>
                
                {isRecording && (
                  <p className="text-xs text-muted-foreground flex items-center space-x-2">
                    <span>🎤 Recording active - your speech will be added to the text above</span>
                  </p>
                )}
                
                {!speechSupported && (
                  <p className="text-xs text-muted-foreground">
                    Speech recognition is not supported in your browser. Voice input is only available in modern browsers like Chrome.
                  </p>
                )}
              </div>

              {/* Character Count */}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{textInput.length} characters</span>
                <span>{textInput.split(/\s+/).filter(word => word.length > 0).length} words</span>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveTextDocument}
                  disabled={!textInput.trim() || !documentTitle.trim() || isSavingText || isRecording}
                  variant="ai"
                  className="transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                >
                  {isSavingText ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save to Knowledge Base
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Document Management Section */}
        <Card className="p-8 bg-gradient-to-br from-white/80 to-ai-muted/50 backdrop-blur-sm border-ai-primary/20 shadow-card">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Your Knowledge Base</h3>
                <p className="text-muted-foreground">Manage your uploaded documents</p>
              </div>
              <Button variant="ai" asChild>
                <a href="/" className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Start Chatting</span>
                </a>
              </Button>
            </div>

            {isLoadingDocuments ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-ai-primary mb-4" />
                <p className="text-muted-foreground">Loading your documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-ai-primary/50 mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet. Upload some documents to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-ai-primary/10 hover:border-ai-primary/20 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-ai-primary" />
                      <div>
                        <p className="font-medium text-foreground">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.upload_date).toLocaleDateString()} • {doc.file_type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};