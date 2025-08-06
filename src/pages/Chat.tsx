import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles, FileText, Mic, MicOff, Upload, Zap, Brain, MessageSquare } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh"></div>
        <Navigation />
        <div className="relative z-10 flex items-center justify-center h-96">
          <div className="text-center animate-fade-up">
            <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-3xl flex items-center justify-center mb-6 shadow-elevated animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Loading your AI Assistant
            </h2>
            <p className="text-muted-foreground">Preparing your conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="absolute inset-0 bg-gradient-mesh"></div>
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Main chat container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          
          {/* Chat Interface - Main Column */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col bg-gradient-card backdrop-blur-xl border-ai-primary/20 shadow-elevated overflow-hidden">
              {/* Enhanced Header */}
              <div className="p-6 border-b border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 via-ai-secondary/5 to-ai-accent/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-ai-primary/20 to-ai-secondary/20 opacity-20 blur-xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-gentle animate-float">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-ai-success rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Personal AI Assistant
                      </h1>
                      <p className="text-sm text-muted-foreground">Your intelligent document companion</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-ai-primary/10 rounded-full">
                      <Zap className="w-3 h-3 text-ai-primary" />
                      <span className="text-xs font-medium text-ai-primary">AI Powered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-hidden relative">
                <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center max-w-md animate-fade-up">
                        <div className="relative mb-8">
                          <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-3xl flex items-center justify-center shadow-elevated animate-float">
                            <MessageSquare className="w-12 h-12 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-secondary rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          Welcome to your AI Assistant
                        </h3>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          Upload documents and start intelligent conversations about your personal data. 
                          Your AI assistant is ready to help with analysis, summaries, and insights.
                        </p>
                        <Button variant="ai" size="lg" asChild className="animate-scale-in">
                          <a href="/upload" className="flex items-center space-x-2">
                            <Upload className="w-5 h-5" />
                            <span>Upload Your First Document</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`flex animate-fade-up ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] flex ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                      } items-start space-x-3`}>
                        
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-gentle ${
                          message.type === 'user' 
                            ? 'bg-gradient-primary' 
                            : 'bg-gradient-secondary'
                        }`}>
                          {message.type === 'user' ? 
                            <User className="w-5 h-5 text-white" /> : 
                            <Bot className="w-5 h-5 text-white" />
                          }
                        </div>
                        
                        {/* Message content */}
                        <div className="space-y-2">
                          <div className={`relative p-4 rounded-2xl transition-all duration-300 hover:shadow-gentle ${
                            message.type === 'user'
                              ? 'bg-gradient-primary text-white shadow-gentle'
                              : 'bg-white/90 border border-ai-primary/10 shadow-soft hover:shadow-card'
                          }`}>
                            {message.type === 'assistant' ? (
                              <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                          </div>

                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="space-y-2 animate-fade-in">
                              <p className="text-xs text-muted-foreground font-medium flex items-center space-x-1">
                                <FileText className="w-3 h-3" />
                                <span>Sources ({message.sources.length})</span>
                              </p>
                              {message.sources.slice(0, 2).map((source, index) => (
                                <div key={index} className="p-3 bg-ai-muted/60 rounded-xl border border-ai-primary/10 hover:bg-ai-muted/80 transition-all duration-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-ai-primary">
                                      Relevance: {Math.round(source.score * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                                    {source.content.substring(0, 180)}...
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-secondary flex items-center justify-center shadow-gentle">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white/90 border border-ai-primary/10 p-4 rounded-2xl shadow-soft">
                          <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                              <div 
                                key={i}
                                className="w-2 h-2 bg-ai-primary rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Enhanced Input Area */}
              <div className="p-6 border-t border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 via-ai-secondary/5 to-ai-accent/5 backdrop-blur-sm">
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isRecording ? "🎤 Listening..." : "Ask me anything about your documents..."}
                      className={`pr-12 h-12 bg-white/80 border-ai-primary/20 focus:border-ai-primary focus:ring-ai-primary/20 rounded-xl transition-all duration-200 placeholder:text-muted-foreground/60 ${
                        isRecording ? 'border-ai-error focus:border-ai-error focus:ring-ai-error/20 animate-pulse-glow' : ''
                      }`}
                      disabled={isLoading || isRecording}
                    />
                    
                    {/* Voice input button */}
                    {speechSupported && (
                      <Button
                        type="button"
                        variant="ai-ghost"
                        size="sm"
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-lg ${
                          isRecording 
                            ? 'text-ai-error hover:text-ai-error animate-pulse' 
                            : 'text-muted-foreground hover:text-ai-primary'
                        }`}
                        onClick={toggleRecording}
                        disabled={isLoading}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  
                  {/* Send button */}
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || isRecording}
                    variant="ai"
                    size="lg"
                    className="h-12 px-6 rounded-xl"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-ai-error animate-fade-in">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i}
                          className="w-1 h-4 bg-ai-error rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                    <span>Recording... Click the microphone to stop</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Sidebar - Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 bg-gradient-card backdrop-blur-xl border-ai-primary/20 shadow-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-ai-primary" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-3">
                <Button variant="ai-outline" size="sm" asChild className="w-full justify-start">
                  <a href="/upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </a>
                </Button>
                <Button variant="ai-ghost" size="sm" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View All Files
                </Button>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="p-6 bg-gradient-to-br from-ai-primary/5 to-ai-secondary/5 border-ai-primary/20 shadow-card">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Pro Tips</h3>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-ai-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ask specific questions about your documents for better results</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-ai-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use voice input for hands-free interaction</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-ai-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Upload multiple formats: PDF, DOCX, TXT</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};