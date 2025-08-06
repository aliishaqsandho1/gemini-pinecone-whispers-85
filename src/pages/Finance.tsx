import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { Plus, DollarSign, TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
}

interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export const Finance: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense'
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const { toast } = useToast();

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Business', 'Personal Care', 'Gifts & Donations', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Business', 'Investment', 'Bonus', 'Other'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const fetchExpenses = async () => {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleCreateExpense = async () => {
    if (!newExpense.amount || !newExpense.category) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([newExpense]);
      
      if (error) throw error;
      
      setNewExpense({
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
      setIsCreating(false);
      fetchExpenses();
      toast({ title: `${newExpense.type === 'income' ? 'Income' : 'Expense'} added successfully!` });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({ title: 'Error adding transaction', variant: 'destructive' });
    }
  };

  const getTotalIncome = () => {
    return expenses
      .filter(exp => exp.type === 'income')
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getTotalExpenses = () => {
    return expenses
      .filter(exp => exp.type === 'expense')
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getNetIncome = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const getCategoryTotals = (): CategoryTotal[] => {
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    expenses
      .filter(exp => exp.type === 'expense')
      .forEach(exp => {
        const current = categoryMap.get(exp.category) || { total: 0, count: 0 };
        categoryMap.set(exp.category, {
          total: current.total + exp.amount,
          count: current.count + 1
        });
      });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-ai-muted/30">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Finance Tracker
            </h1>
            <p className="text-muted-foreground mt-2">Manage your income and expenses</p>
          </div>

          {/* Month Selector and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  return (
                    <SelectItem key={monthStr} value={monthStr}>
                      {getMonthName(monthStr)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-card to-green-50 dark:to-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalIncome())}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-red-50 dark:to-red-950/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalExpenses())}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Income</p>
                    <p className={`text-2xl font-bold ${getNetIncome() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(getNetIncome())}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-ai-primary/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Transaction Form */}
          {isCreating && (
            <Card className="mb-6 bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardHeader>
                <CardTitle className="text-ai-primary">Add New Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newExpense.type}
                    onValueChange={(value: 'income' | 'expense') => 
                      setNewExpense({ ...newExpense, type: value, category: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newExpense.type === 'income' ? incomeCategories : categories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Description (optional)"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateExpense}
                    className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
                  >
                    Add Transaction
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
                <CardHeader>
                  <CardTitle className="text-ai-primary">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses.length > 0 ? (
                    <div className="space-y-3">
                      {expenses.slice(0, 10).map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-ai-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${expense.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <p className="font-medium">{expense.description || expense.category}</p>
                              <p className="text-sm text-muted-foreground">{expense.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions this month</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="bg-gradient-to-br from-card to-ai-muted/20 border-ai-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ai-primary">
                  <PieChart className="w-5 h-5" />
                  Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getCategoryTotals().length > 0 ? (
                  <div className="space-y-3">
                    {getCategoryTotals().slice(0, 8).map((category) => {
                      const percentage = (category.total / getTotalExpenses()) * 100;
                      return (
                        <div key={category.category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{category.category}</span>
                            <span className="text-muted-foreground">{formatCurrency(category.total)}</span>
                          </div>
                          <div className="w-full bg-ai-muted/30 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-ai-primary to-ai-secondary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No expense data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};