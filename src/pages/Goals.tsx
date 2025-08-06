import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { Plus, Target, Calendar, TrendingUp, CheckCircle, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  active: boolean;
  created_at: string;
}

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'goals' | 'habits'>('goals');
  const [isCreating, setIsCreating] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    target_value: 0,
    unit: '',
    deadline: ''
  });
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
    fetchHabits();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;

    try {
      const { error } = await supabase
        .from('goals')
        .insert([{
          ...newGoal,
          current_value: 0,
          status: 'active'
        }]);
      
      if (error) throw error;
      
      setNewGoal({ title: '', description: '', category: '', target_value: 0, unit: '', deadline: '' });
      setIsCreating(false);
      fetchGoals();
      toast({ title: 'Goal created successfully!' });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({ title: 'Error creating goal', variant: 'destructive' });
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) return;

    try {
      const { error } = await supabase
        .from('habits')
        .insert([{
          ...newHabit,
          streak: 0,
          active: true
        }]);
      
      if (error) throw error;
      
      setNewHabit({ name: '', description: '', frequency: 'daily' });
      setIsCreating(false);
      fetchHabits();
      toast({ title: 'Habit created successfully!' });
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({ title: 'Error creating habit', variant: 'destructive' });
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const status = newValue >= goal.target_value ? 'completed' : 'active';
      
      const { error } = await supabase
        .from('goals')
        .update({ current_value: newValue, status })
        .eq('id', goalId);
      
      if (error) throw error;
      
      fetchGoals();
      if (status === 'completed') {
        toast({ title: 'Goal completed! 🎉' });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({ title: 'Error updating goal', variant: 'destructive' });
    }
  };

  const incrementHabitStreak = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const { error } = await supabase
        .from('habits')
        .update({ streak: habit.streak + 1 })
        .eq('id', habitId);
      
      if (error) throw error;
      
      fetchHabits();
      toast({ title: 'Habit tracked! 🔥' });
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({ title: 'Error updating habit', variant: 'destructive' });
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-ai-muted/30">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Goals & Habits
            </h1>
            <p className="text-muted-foreground mt-2">Track your progress and build lasting habits</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={activeTab === 'goals' ? 'default' : 'outline'}
              onClick={() => setActiveTab('goals')}
              className={activeTab === 'goals' ? 'bg-gradient-to-r from-ai-primary to-ai-secondary' : ''}
            >
              <Target className="w-4 h-4 mr-2" />
              Goals
            </Button>
            <Button
              variant={activeTab === 'habits' ? 'default' : 'outline'}
              onClick={() => setActiveTab('habits')}
              className={activeTab === 'habits' ? 'bg-gradient-to-r from-ai-primary to-ai-secondary' : ''}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Habits
            </Button>
          </div>

          {/* Create Button */}
          <div className="mb-6">
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New {activeTab === 'goals' ? 'Goal' : 'Habit'}
            </Button>
          </div>

          {/* Create Form */}
          {isCreating && (
            <Card className="mb-6 bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardHeader>
                <CardTitle className="text-ai-primary">
                  Create New {activeTab === 'goals' ? 'Goal' : 'Habit'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTab === 'goals' ? (
                  <>
                    <Input
                      placeholder="Goal title"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Category"
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                      />
                      <Input
                        placeholder="Unit (e.g., kg, hours, books)"
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Target value"
                        value={newGoal.target_value || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                      />
                      <Input
                        type="date"
                        placeholder="Deadline"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder="Habit name"
                      value={newHabit.name}
                      onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    />
                    <Select
                      value={newHabit.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                        setNewHabit({ ...newHabit, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={activeTab === 'goals' ? handleCreateGoal : handleCreateHabit}
                    className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
                  >
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goals Content */}
          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => {
                const progress = getProgressPercentage(goal);
                const daysLeft = getDaysUntilDeadline(goal.deadline);
                
                return (
                  <Card key={goal.id} className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-ai-primary">{goal.title}</CardTitle>
                          <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'} className="mt-2">
                            {goal.status}
                          </Badge>
                        </div>
                        {goal.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% complete</p>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)} days overdue`}
                        </div>
                      )}

                      {goal.status !== 'completed' && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Update progress"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = Number((e.target as HTMLInputElement).value);
                                updateGoalProgress(goal.id, value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Habits Content */}
          {activeTab === 'habits' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => (
                <Card key={habit.id} className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-ai-primary">{habit.name}</CardTitle>
                      <Badge variant={habit.active ? 'default' : 'secondary'}>
                        {habit.active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{habit.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-ai-primary">{habit.streak}</p>
                        <p className="text-xs text-muted-foreground">day streak</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {habit.frequency}
                      </Badge>
                    </div>

                    {habit.active && (
                      <Button
                        onClick={() => incrementHabitStreak(habit.id)}
                        className="w-full bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty States */}
          {((activeTab === 'goals' && goals.length === 0) || (activeTab === 'habits' && habits.length === 0)) && (
            <div className="text-center py-12">
              {activeTab === 'goals' ? (
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              ) : (
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              )}
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No {activeTab} yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first {activeTab === 'goals' ? 'goal' : 'habit'} to start tracking your progress
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First {activeTab === 'goals' ? 'Goal' : 'Habit'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};