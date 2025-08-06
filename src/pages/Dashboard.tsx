import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { Calendar, CheckSquare, Target, DollarSign, FileText, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalTodos: number;
  completedTodos: number;
  upcomingEvents: number;
  totalGoals: number;
  activeHabits: number;
  monthlyExpenses: number;
  totalNotes: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTodos: 0,
    completedTodos: 0,
    upcomingEvents: 0,
    totalGoals: 0,
    activeHabits: 0,
    monthlyExpenses: 0,
    totalNotes: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch todos
      const { data: todos } = await supabase.from('todos').select('*');
      const totalTodos = todos?.length || 0;
      const completedTodos = todos?.filter(todo => todo.completed).length || 0;

      // Fetch upcoming events (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .lte('start_date', nextWeek.toISOString());
      const upcomingEvents = events?.length || 0;

      // Fetch goals and habits
      const { data: goals } = await supabase.from('goals').select('*');
      const { data: habits } = await supabase.from('habits').select('*').eq('active', true);
      
      // Fetch expenses for current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', currentMonth.toISOString());
      const monthlyExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

      // Fetch notes
      const { data: notes } = await supabase.from('notes').select('*');
      const totalNotes = notes?.length || 0;

      setStats({
        totalTodos,
        completedTodos,
        upcomingEvents,
        totalGoals: goals?.length || 0,
        activeHabits: habits?.length || 0,
        monthlyExpenses,
        totalNotes,
      });

      // Fetch recent activities (last 5 items across all tables)
      const activities = [];
      if (todos) activities.push(...todos.slice(-3).map(t => ({ type: 'Todo', title: t.title, date: t.created_at })));
      if (events) activities.push(...events.slice(-2).map(e => ({ type: 'Event', title: e.title, date: e.created_at })));
      
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const completionRate = stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-ai-muted/30">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Your personal productivity overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Todo Progress</p>
                    <p className="text-2xl font-bold text-ai-primary">{completionRate}%</p>
                    <p className="text-xs text-muted-foreground">{stats.completedTodos}/{stats.totalTodos} completed</p>
                  </div>
                  <CheckSquare className="w-8 h-8 text-ai-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Events</p>
                    <p className="text-2xl font-bold text-ai-secondary">{stats.upcomingEvents}</p>
                    <p className="text-xs text-muted-foreground">next 7 days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-ai-secondary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Goals</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.totalGoals}</p>
                    <p className="text-xs text-muted-foreground">{stats.activeHabits} habits tracked</p>
                  </div>
                  <Target className="w-8 h-8 text-emerald-600/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-orange-600">${stats.monthlyExpenses.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{stats.totalNotes} notes saved</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ai-primary">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-ai-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {activity.type}
                        </Badge>
                        <span className="text-sm font-medium">{activity.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start by creating todos, events, or notes!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
};