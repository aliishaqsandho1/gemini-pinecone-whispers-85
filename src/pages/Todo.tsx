import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckSquare, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

export const Todo: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo.trim(),
            completed: false,
            priority: 'medium'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTodos(prev => [data, ...prev]);
      setNewTodo('');
      toast({
        title: "Todo added",
        description: "Your new todo has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add todo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', id);

      if (error) throw error;

      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, completed } : todo
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update todo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(prev => prev.filter(todo => todo.id !== id));
      toast({
        title: "Todo deleted",
        description: "Your todo has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete todo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ai-background via-white to-ai-muted/30">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent mb-2">
            My Todos
          </h1>
          <p className="text-muted-foreground">Organize your tasks and stay productive</p>
        </div>

        <Card className="bg-gradient-to-br from-white/90 to-ai-muted/30 backdrop-blur-sm border-ai-primary/20 shadow-card">
          {/* Add Todo */}
          <div className="p-6 border-b border-ai-primary/10">
            <div className="flex space-x-3">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo..."
                className="border-ai-primary/20 focus:border-ai-primary focus:ring-ai-primary/20"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              <Button
                onClick={addTodo}
                disabled={!newTodo.trim() || isLoading}
                variant="ai"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="p-6 border-b border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex space-x-2">
                {(['all', 'active', 'completed'] as const).map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? 'ai' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(filterType)}
                    className="capitalize"
                  >
                    {filterType}
                  </Button>
                ))}
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredTodos.length} {filteredTodos.length === 1 ? 'todo' : 'todos'}
              </div>
            </div>
          </div>

          {/* Todo List */}
          <div className="p-6">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 mx-auto text-ai-primary/40 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {filter === 'all' ? 'No todos yet' : `No ${filter} todos`}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? 'Add your first todo to get started!' 
                    : `You have no ${filter} todos at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      todo.completed
                        ? 'bg-muted/50 border-muted'
                        : 'bg-white/80 border-ai-primary/10 hover:border-ai-primary/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked) => toggleTodo(todo.id, checked as boolean)}
                        className="border-ai-primary/30 data-[state=checked]:bg-ai-primary data-[state=checked]:border-ai-primary"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            todo.completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {todo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(todo.priority)}
                        >
                          {todo.priority}
                        </Badge>
                        
                        {todo.due_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(todo.due_date).toLocaleDateString()}
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTodo(todo.id)}
                          className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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