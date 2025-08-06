import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { Plus, Search, BookOpen, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({ title: 'Error fetching notes', variant: 'destructive' });
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;

    try {
      const tags = newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const { error } = await supabase
        .from('notes')
        .insert([{
          title: newNote.title,
          content: newNote.content,
          tags: tags,
        }]);
      
      if (error) throw error;
      
      setNewNote({ title: '', content: '', tags: '' });
      setIsCreating(false);
      fetchNotes();
      toast({ title: 'Note created successfully!' });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({ title: 'Error creating note', variant: 'destructive' });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editingNote.title,
          content: editingNote.content,
          tags: editingNote.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id);
      
      if (error) throw error;
      
      setEditingNote(null);
      fetchNotes();
      toast({ title: 'Note updated successfully!' });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({ title: 'Error updating note', variant: 'destructive' });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      
      fetchNotes();
      toast({ title: 'Note deleted successfully!' });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: 'Error deleting note', variant: 'destructive' });
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-ai-muted/30">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Notes
            </h1>
            <p className="text-muted-foreground mt-2">Your personal knowledge base</p>
          </div>

          {/* Search and Create */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>

          {/* Create/Edit Note Form */}
          {(isCreating || editingNote) && (
            <Card className="mb-6 bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardHeader>
                <CardTitle className="text-ai-primary">
                  {isCreating ? 'Create New Note' : 'Edit Note'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Note title"
                  value={isCreating ? newNote.title : editingNote?.title || ''}
                  onChange={(e) => 
                    isCreating 
                      ? setNewNote({ ...newNote, title: e.target.value })
                      : setEditingNote({ ...editingNote!, title: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Note content"
                  value={isCreating ? newNote.content : editingNote?.content || ''}
                  onChange={(e) => 
                    isCreating 
                      ? setNewNote({ ...newNote, content: e.target.value })
                      : setEditingNote({ ...editingNote!, content: e.target.value })
                  }
                  rows={6}
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={isCreating ? newNote.tags : editingNote?.tags.join(', ') || ''}
                  onChange={(e) => 
                    isCreating 
                      ? setNewNote({ ...newNote, tags: e.target.value })
                      : setEditingNote({ ...editingNote!, tags: e.target.value.split(',').map(t => t.trim()) })
                  }
                />
                <div className="flex gap-2">
                  <Button
                    onClick={isCreating ? handleCreateNote : handleUpdateNote}
                    className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
                  >
                    {isCreating ? 'Create' : 'Update'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingNote(null);
                      setNewNote({ title: '', content: '', tags: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Grid */}
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-ai-primary line-clamp-2">
                        {note.title}
                      </CardTitle>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNote(note)}
                          className="w-8 h-8 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {note.content || 'No content'}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first note to get started'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Note
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};