import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG } from './api-config';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_CONFIG.GEMINI_API_KEY);

export interface Document {
  id: string;
  content: string;
  metadata: {
    title: string;
    uploadDate: string;
    type: string;
  };
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: any;
}

// Browser-compatible vector store
class BrowserVectorStore {
  private documents: Array<{
    id: string;
    content: string;
    embedding: number[];
    metadata: any;
  }> = [];

  async store(id: string, content: string, embedding: number[], metadata: any) {
    // Remove existing document with same ID
    this.documents = this.documents.filter(doc => doc.id !== id);
    
    // Add new document
    this.documents.push({ id, content, embedding, metadata });
    
    // Store in localStorage for persistence
    localStorage.setItem('rag_documents', JSON.stringify(this.documents));
  }

  async search(queryEmbedding: number[], topK: number = 5): Promise<SearchResult[]> {
    // Load from localStorage
    const stored = localStorage.getItem('rag_documents');
    if (stored) {
      this.documents = JSON.parse(stored);
    }

    // Calculate cosine similarity for each document
    const results = this.documents.map(doc => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return {
        content: doc.content,
        score: similarity,
        metadata: doc.metadata
      };
    });

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

class RAGService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private vectorStore = new BrowserVectorStore();

  // Generate embeddings using a simple hash-based approach for demo
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For demo purposes, we'll create a simple hash-based embedding
      // In production, you'd want to use a proper embedding model
      const hash = this.simpleHash(text);
      const embedding = Array.from({ length: 384 }, (_, i) => {
        return Math.sin(hash * (i + 1)) * Math.cos(hash * (i + 2));
      });
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback: generate random embedding for demo
      return Array.from({ length: 384 }, () => Math.random() - 0.5);
    }
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 1000000; // Normalize
  }

  // Store document in vector database
  async storeDocument(document: Document): Promise<void> {
    const embedding = await this.generateEmbedding(document.content);
    
    await this.vectorStore.store(
      document.id,
      document.content,
      embedding,
      document.metadata
    );
  }

  // Search for relevant documents
  async searchDocuments(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    return await this.vectorStore.search(queryEmbedding, topK);
  }

  // Generate response using RAG
  async generateResponse(query: string, context: string): Promise<string> {
    console.log('🤖 Generating response for query:', query);
    console.log('📄 Context length:', context.length);
    
    const prompt = `
You are a helpful AI assistant with access to relevant documents. Answer the user's question based on the provided context.

Context:
${context}

Question: ${query}

Please provide a comprehensive and accurate answer based on the context provided. If the context doesn't contain enough information to answer the question, please say so.
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
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // More specific error handling
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

  // Process query with RAG pipeline
  async processQuery(query: string): Promise<{
    response: string;
    sources: SearchResult[];
  }> {
    console.log('🔍 Processing query:', query);
    
    // Search for relevant documents
    console.log('🔎 Searching for relevant documents...');
    const sources = await this.searchDocuments(query);
    console.log('📚 Found', sources.length, 'relevant documents');
    
    if (sources.length === 0) {
      console.log('⚠️ No documents found in vector store');
      return {
        response: "I don't have any relevant documents to answer your question. Please upload some documents first.",
        sources: []
      };
    }
    
    // Combine context from top results
    const context = sources
      .slice(0, 3)
      .map(source => source.content)
      .join('\n\n');
    
    console.log('📄 Combined context length:', context.length);

    // Generate response
    const response = await this.generateResponse(query, context);

    return { response, sources };
  }
}

export const ragService = new RAGService();