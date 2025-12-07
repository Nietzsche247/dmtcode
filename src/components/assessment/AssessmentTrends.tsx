import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AssessmentTrendsProps {
  currentAssessmentId: string;
}

interface HistoricalAssessment {
  id: string;
  created_at: string;
  phq9_score: number | null;
  gad7_score: number | null;
  mood_pre: number | null;
  mood_post: number | null;
}

interface TrendData {
  date: string;
  dateLabel: string;
  phq9: number | null;
  gad7: number | null;
  moodPre: number | null;
  moodPost: number | null;
}

export function AssessmentTrends({ currentAssessmentId }: AssessmentTrendsProps) {
  const [assessments, setAssessments] = useState<HistoricalAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistoricalAssessments();
  }, [currentAssessmentId]);

  const loadHistoricalAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('assessments')
        .select('id, created_at, phq9_score, gad7_score, mood_pre, mood_post')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Failed to load historical assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Need at least 2 assessments for trends
  if (isLoading || assessments.length < 2) {
    return null;
  }

  const trendData: TrendData[] = assessments.map(a => ({
    date: a.created_at,
    dateLabel: format(new Date(a.created_at), 'MMM d'),
    phq9: a.phq9_score,
    gad7: a.gad7_score,
    moodPre: a.mood_pre,
    moodPost: a.mood_post
  }));

  // Calculate trends (compare latest to previous)
  const latest = assessments[assessments.length - 1];
  const previous = assessments[assessments.length - 2];

  const calculateTrend = (current: number | null, prev: number | null) => {
    if (current === null || prev === null) return { delta: 0, direction: 'neutral' as const };
    const delta = current - prev;
    return {
      delta,
      direction: delta > 0 ? 'up' as const : delta < 0 ? 'down' as const : 'neutral' as const
    };
  };

  const phq9Trend = calculateTrend(latest.phq9_score, previous.phq9_score);
  const gad7Trend = calculateTrend(latest.gad7_score, previous.gad7_score);
  const moodTrend = calculateTrend(latest.mood_post, previous.mood_post);

  // For PHQ-9/GAD-7, lower is better. For mood, higher is better.
  const getTrendBadge = (trend: { delta: number; direction: 'up' | 'down' | 'neutral' }, lowerIsBetter: boolean) => {
    const { delta, direction } = trend;
    if (direction === 'neutral') {
      return { icon: Minus, color: 'bg-muted text-muted-foreground', label: 'No change' };
    }
    
    const isImprovement = lowerIsBetter ? direction === 'down' : direction === 'up';
    
    if (isImprovement) {
      return { 
        icon: lowerIsBetter ? TrendingDown : TrendingUp, 
        color: 'bg-green-500/20 text-green-500', 
        label: `${delta > 0 ? '+' : ''}${delta} (improving)` 
      };
    } else {
      return { 
        icon: lowerIsBetter ? TrendingUp : TrendingDown, 
        color: 'bg-destructive/20 text-destructive', 
        label: `${delta > 0 ? '+' : ''}${delta} (worsening)` 
      };
    }
  };

  const phq9Badge = getTrendBadge(phq9Trend, true);
  const gad7Badge = getTrendBadge(gad7Trend, true);
  const moodBadge = getTrendBadge(moodTrend, false);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Assessment Trends
        </CardTitle>
        <CardDescription>
          Tracking {assessments.length} assessments over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">PHQ-9 (Depression)</p>
            <div className="flex items-center gap-2">
              <Badge className={phq9Badge.color}>
                <phq9Badge.icon className="h-3 w-3 mr-1" />
                {phq9Badge.label}
              </Badge>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">GAD-7 (Anxiety)</p>
            <div className="flex items-center gap-2">
              <Badge className={gad7Badge.color}>
                <gad7Badge.icon className="h-3 w-3 mr-1" />
                {gad7Badge.label}
              </Badge>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Mood (Post-Session)</p>
            <div className="flex items-center gap-2">
              <Badge className={moodBadge.color}>
                <moodBadge.icon className="h-3 w-3 mr-1" />
                {moodBadge.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* PHQ-9 & GAD-7 Chart */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Depression & Anxiety Scores</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  domain={[0, 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="phq9" 
                  name="PHQ-9" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="gad7" 
                  name="GAD-7" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Lower scores indicate fewer symptoms
          </p>
        </div>

        {/* Mood Chart */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Mood Tracking</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  domain={[0, 10]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="moodPre" 
                  name="Pre-Session" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#94a3b8' }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="moodPost" 
                  name="Post-Session" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Higher scores indicate better mood (0-10 scale)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
