import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ragService } from '@/lib/rag-service';

export const DocumentUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('📁 Starting file upload for', files.length, 'files');
    setIsUploading(true);

    try {
      for (const file of files) {
        console.log('📄 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        const content = await readFileContent(file);
        console.log('📝 File content length:', content.length);
        console.log('📝 First 200 chars:', content.substring(0, 200));
        
        const document = {
          id: `${Date.now()}-${file.name}`,
          content,
          metadata: {
            title: file.name,
            uploadDate: new Date().toISOString(),
            type: file.type || 'text/plain'
          }
        };

        console.log('💾 Storing document with ID:', document.id);
        await ragService.storeDocument(document);
        console.log('✅ Document stored successfully');
        
        setUploadedFiles(prev => [...prev, file.name]);
      }

      toast({
        title: "Documents uploaded successfully",
        description: `${files.length} document(s) have been processed and stored.`,
      });
      
      console.log('🎉 All files uploaded successfully');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your documents.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

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
    <Card className="p-8 bg-gradient-to-br from-white/80 to-ai-muted/50 backdrop-blur-sm border-ai-primary/20 shadow-card hover:shadow-elevated transition-all duration-300">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-ai-primary to-ai-secondary rounded-2xl flex items-center justify-center shadow-gentle">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-semibold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
            Upload Documents
          </h3>
          <p className="text-muted-foreground">
            Add documents to your knowledge base for intelligent querying
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="file-upload" className="text-sm font-medium">
            Select Files
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
            <span className="text-sm">Processing documents...</span>
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
  );
};