import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG } from './api-config';
import { supabase, Document, ChatMessage } from './supabase';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_CONFIG.GEMINI_API_KEY);

export interface SearchResult {
  content: string;
  score: number;
  metadata: any;
}

class SupabaseRAGService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Generate embeddings using simple hash-based approach
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const hash = this.simpleHash(text);
      const embedding = Array.from({ length: 384 }, (_, i) => {
        return Math.sin(hash * (i + 1)) * Math.cos(hash * (i + 2));
      });
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return Array.from({ length: 384 }, () => Math.random() - 0.5);
    }
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 1000000;
  }

  // Upload file to Supabase Storage
  async uploadFile(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      console.log('📤 Uploading file to Supabase Storage:', filePath);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) {
        console.error('❌ Upload error:', error);
        return null;
      }

      console.log('✅ File uploaded successfully:', data.path);
      return data.path;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }
  }

  // Store document in Supabase database
  async storeDocument(document: Omit<Document, 'id' | 'upload_date'>): Promise<boolean> {
    try {
      console.log('💾 Storing document in database...');
      
      const embedding = await this.generateEmbedding(document.content);
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: document.title,
          content: document.content,
          file_path: document.file_path,
          file_type: document.file_type,
          embedding: embedding,
          upload_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        return false;
      }

      console.log('✅ Document stored successfully:', data.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to store document:', error);
      return false;
    }
  }

  // Search documents using vector similarity
  async searchDocuments(query: string, topK: number = 5): Promise<SearchResult[]> {
    try {
      console.log('🔍 Searching documents for:', query);
      
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Get all documents (in production, you'd use pgvector for proper similarity search)
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*');

      if (error) {
        console.error('❌ Search error:', error);
        return [];
      }

      if (!documents || documents.length === 0) {
        console.log('📚 No documents found');
        return [];
      }

      // Calculate cosine similarity for each document
      const results = documents
        .map(doc => {
          const embedding = doc.embedding || [];
          const similarity = this.cosineSimilarity(queryEmbedding, embedding);
          return {
            content: doc.content,
            score: similarity,
            metadata: {
              title: doc.title,
              upload_date: doc.upload_date,
              type: doc.file_type
            }
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      console.log('📋 Found', results.length, 'relevant documents');
      return results;
    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Generate response using RAG
  async generateResponse(query: string, context: string): Promise<string> {
    console.log('🤖 Generating response for query:', query);
    console.log('📄 Context length:', context.length);
    
    const prompt = `
You are a helpful personal AI assistant with access to the user's documents and personal information. Answer the user's question based on the provided context from their personal documents.

Context from user's documents:
${context}

Question: ${query}

Please provide a comprehensive and personalized answer based on the context provided. If the context doesn't contain enough information to answer the question, please say so.
    `;

    try {
      console.log('🚀 Calling Gemini API...');
      const result = await this.model.generateContent(prompt);
      console.log('✅ Gemini API response received');
      const response = await result.response;
      const text = response.text();
      console.log('📝 Generated response:', text.substring(0, 100) + '...');
      return text;
    } catch (error) {
      console.error('❌ Error generating response:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          return 'Error: Invalid API key. Please check your Gemini API configuration.';
        }
        if (error.message.includes('quota')) {
          return 'Error: API quota exceeded. Please try again later.';
        }
        if (error.message.includes('SAFETY')) {
          return 'The content was blocked for safety reasons. Please try rephrasing your question.';
        }
      }
      
      return `I apologize, but I encountered an error while generating a response: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
    }
  }

  // Save chat message to database
  async saveChatMessage(content: string, role: 'user' | 'assistant', sources?: SearchResult[]): Promise<void> {
    try {
      await supabase
        .from('chat_messages')
        .insert({
          content,
          role,
          sources,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Failed to save chat message:', error);
    }
  }

  // Get chat history
  async getChatHistory(limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to get chat history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get chat history:', error);
      return [];
    }
  }

  // Process query with RAG pipeline
  async processQuery(query: string): Promise<{
    response: string;
    sources: SearchResult[];
  }> {
    console.log('🔍 Processing query:', query);
    
    // Save user message
    await this.saveChatMessage(query, 'user');
    
    // Search for relevant documents
    console.log('🔎 Searching for relevant documents...');
    const sources = await this.searchDocuments(query);
    console.log('📚 Found', sources.length, 'relevant documents');
    
    if (sources.length === 0) {
      console.log('⚠️ No documents found in database');
      const response = "I don't have any relevant documents to answer your question. Please upload some documents first.";
      await this.saveChatMessage(response, 'assistant');
      return { response, sources: [] };
    }
    
    // Combine context from top results
    const context = sources
      .slice(0, 3)
      .map(source => source.content)
      .join('\n\n');
    
    console.log('📄 Combined context length:', context.length);

    // Generate response
    const response = await this.generateResponse(query, context);
    
    // Save assistant message
    await this.saveChatMessage(response, 'assistant', sources);

    return { response, sources };
  }

  // Get all documents for management
  async getDocuments(): Promise<Partial<Document>[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, file_type, upload_date')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('❌ Failed to get documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get documents:', error);
      return [];
    }
  }

  // Delete document
  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Failed to delete document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      return false;
    }
  }
}

export const supabaseRAGService = new SupabaseRAGService();