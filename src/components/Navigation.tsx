import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Upload, Bot, Moon, Sun, CheckSquare, Calendar, LayoutDashboard, BookOpen, Target, DollarSign } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b border-ai-primary/10 bg-gradient-to-r from-white/90 to-ai-muted/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-ai-primary to-ai-secondary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Personal AI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Button
              variant={location.pathname === '/dashboard' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/dashboard">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
            </Button>

            <Button
              variant={location.pathname === '/' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden lg:inline">Chat</span>
              </Link>
            </Button>
            
            <Button
              variant={location.pathname === '/todo' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/todo">
                <CheckSquare className="w-4 h-4" />
                <span className="hidden md:inline">Todo</span>
              </Link>
            </Button>

            <Button
              variant={location.pathname === '/calendar' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/calendar">
                <Calendar className="w-4 h-4" />
                <span className="hidden md:inline">Calendar</span>
              </Link>
            </Button>

            <Button
              variant={location.pathname === '/notes' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/notes">
                <BookOpen className="w-4 h-4" />
                <span className="hidden lg:inline">Notes</span>
              </Link>
            </Button>

            <Button
              variant={location.pathname === '/goals' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/goals">
                <Target className="w-4 h-4" />
                <span className="hidden lg:inline">Goals</span>
              </Link>
            </Button>

            <Button
              variant={location.pathname === '/finance' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/finance">
                <DollarSign className="w-4 h-4" />
                <span className="hidden lg:inline">Finance</span>
              </Link>
            </Button>
            
            <Button
              variant={location.pathname === '/upload' ? 'ai' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
              size="sm"
            >
              <Link to="/upload">
                <Upload className="w-4 h-4" />
                <span className="hidden lg:inline">Upload</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};