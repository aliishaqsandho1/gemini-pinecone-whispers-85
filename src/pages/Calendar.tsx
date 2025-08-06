import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { CalendarDays, Clock, Plus, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format, isSameDay, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  created_at: string;
}

export const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const dayEvents = events.filter(event => 
      isSameDay(parseISO(event.start_date), selectedDate)
    );
    setSelectedEvents(dayEvents);
  }, [selectedDate, events]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const getDaysWithEvents = () => {
    return events.map(event => parseISO(event.start_date));
  };

  const getEventTypeColor = (index: number) => {
    const colors = [
      'bg-ai-primary/20 text-ai-primary border-ai-primary/30',
      'bg-ai-secondary/20 text-ai-secondary border-ai-secondary/30',
      'bg-ai-accent/20 text-ai-accent border-ai-accent/30',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
    ];
    return colors[index % colors.length];
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ai-background via-white to-ai-muted/30">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent mb-2">
            Calendar
          </h1>
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-white/90 to-ai-muted/30 backdrop-blur-sm border-ai-primary/20 shadow-card">
            <div className="p-6 border-b border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-ai-primary to-ai-secondary rounded-xl flex items-center justify-center shadow-gentle">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {format(selectedDate, 'MMMM yyyy')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, 'EEEE, MMMM do')}
                    </p>
                  </div>
                </div>
                <Button variant="ai" size="sm" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </Button>
              </div>
            </div>

            <div className="p-6">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full"
                modifiers={{
                  hasEvents: getDaysWithEvents(),
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: 'hsl(var(--ai-primary) / 0.1)',
                    color: 'hsl(var(--ai-primary))',
                    fontWeight: 'bold',
                  },
                }}
              />
            </div>
          </Card>

          {/* Events for Selected Date */}
          <Card className="bg-gradient-to-br from-white/90 to-ai-muted/30 backdrop-blur-sm border-ai-primary/20 shadow-card">
            <div className="p-6 border-b border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
              <h3 className="text-lg font-semibold">
                Events for {format(selectedDate, 'MMM do')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
              </p>
            </div>

            <div className="p-6">
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 mx-auto text-ai-primary/40 mb-4" />
                  <h4 className="text-lg font-medium text-foreground mb-2">No events</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    No events scheduled for this day
                  </p>
                  <Button variant="ai" size="sm" className="flex items-center space-x-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="p-4 rounded-xl border bg-white/80 border-ai-primary/10 hover:border-ai-primary/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        <Badge
                          variant="outline"
                          className={getEventTypeColor(index)}
                        >
                          Event
                        </Badge>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-2" />
                          <span>
                            {formatTime(event.start_date)}
                            {event.end_date && ` - ${formatTime(event.end_date)}`}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card className="mt-6 bg-gradient-to-br from-white/90 to-ai-muted/30 backdrop-blur-sm border-ai-primary/20 shadow-card">
          <div className="p-6 border-b border-ai-primary/10 bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
            <p className="text-sm text-muted-foreground">Your next scheduled events</p>
          </div>

          <div className="p-6">
            {events.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 mx-auto text-ai-primary/40 mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">No upcoming events</h4>
                <p className="text-muted-foreground text-sm">
                  Create your first event to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 6).map((event, index) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border bg-white/80 border-ai-primary/10 hover:border-ai-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
                      <Badge
                        variant="outline"
                        className={`${getEventTypeColor(index)} text-xs`}
                      >
                        {format(parseISO(event.start_date), 'MMM do')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-2" />
                      <span>{formatTime(event.start_date)}</span>
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