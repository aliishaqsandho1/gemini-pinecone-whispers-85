import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles, FileText, Mic, MicOff, Volume2 } from 'lucide-react';
import { supabaseRAGService, SearchResult } from '@/lib/supabase-rag-service';
import { Navigation } from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
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

        setInput(transcript);
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
      setInput('');
      recognition.start();
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await supabaseRAGService.getChatHistory(50);
      const formattedMessages: Message[] = history.map(msg => ({
        id: msg.id,
        type: msg.role,
        content: msg.content,
        sources: msg.sources,
        timestamp: new Date(msg.created_at)
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { response, sources } = await supabaseRAGService.processQuery(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ai-background via-white to-ai-muted/30">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-ai-primary to-ai-secondary rounded-2xl flex items-center justify-center mb-4 shadow-gentle animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-muted-foreground">Loading your conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ai-background via-white to-ai-muted/30">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <Card className="h-[calc(100vh-200px)] flex flex-col bg-gradient-to-br from-white/90 to-ai-muted/30 backdrop-blur-sm border-ai-primary/20 shadow-card">
          {/* Header */}
          <div className="p-6 border-b border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ai-primary to-ai-secondary rounded-xl flex items-center justify-center shadow-gentle">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                  Personal AI Assistant
                </h3>
                <p className="text-sm text-muted-foreground">Ask questions about your personal documents and data</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-ai-primary/20 to-ai-secondary/20 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-ai-primary" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">Welcome to your Personal AI Assistant</h4>
                <p className="text-muted-foreground mb-4">Upload some documents and start asking questions about your personal data!</p>
                <Button variant="ai" asChild>
                  <a href="/upload" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Upload Documents</span>
                  </a>
                </Button>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-ai-primary text-white' 
                      : 'bg-gradient-to-br from-ai-secondary to-ai-accent text-white'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-ai-primary text-white ml-3'
                        : 'bg-white/80 border border-ai-primary/10 mr-3'
                    }`}>
                      {message.type === 'assistant' ? (
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ai-secondary to-ai-accent text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/80 border border-ai-primary/10 p-4 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-ai-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input */}
          <div className="p-6 border-t border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
            <div className="flex space-x-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "Listening..." : "Type or speak your question..."}
                  className={`pr-12 border-ai-primary/20 focus:border-ai-primary focus:ring-ai-primary/20 transition-all duration-200 ${
                    isRecording ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                  disabled={isLoading || isRecording}
                />
                {speechSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
                      isRecording 
                        ? 'text-red-500 hover:text-red-600 animate-pulse' 
                        : 'text-muted-foreground hover:text-ai-primary'
                    }`}
                    onClick={toggleRecording}
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isRecording}
                variant="ai"
                className="h-10 px-4 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {isRecording && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-muted-foreground animate-fade-in">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>Recording... Click the microphone to stop</span>
              </div>
            )}
            
            {!speechSupported && (
              <p className="mt-2 text-xs text-muted-foreground">
                Speech recognition is not supported in your browser. Please use a modern browser like Chrome.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};