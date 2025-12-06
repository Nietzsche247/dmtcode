import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SharedAssessmentData {
  id: string;
  phq9_score: number | null;
  gad7_score: number | null;
  meq4_score: number | null;
  ceq7_score: number | null;
  mood_pre: number | null;
  mood_post: number | null;
  context_jsonb: any;
  created_at: string;
  voice_logs?: {
    transcript: string | null;
    duration_seconds: number | null;
  };
}

export default function SharedAssessment() {
  const { token } = useParams<{ token: string }>();
  const [assessment, setAssessment] = useState<SharedAssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedAssessment();
  }, [token]);

  const loadSharedAssessment = async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('share-assessment', {
        body: {
          action: 'get_shared',
          share_token: token
        }
      });

      if (fetchError) throw fetchError;
      if (data.error) throw new Error(data.error);
      
      setAssessment(data.assessment);
    } catch (err) {
      console.error('Failed to load shared assessment:', err);
      setError('This assessment is not available or the link has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPhq9Interpretation = (score: number | null): string => {
    if (score === null) return "Not assessed";
    if (score <= 4) return "Minimal depression";
    if (score <= 9) return "Mild depression";
    if (score <= 14) return "Moderate depression";
    if (score <= 19) return "Moderately severe depression";
    return "Severe depression";
  };

  const getGad7Interpretation = (score: number | null): string => {
    if (score === null) return "Not assessed";
    if (score <= 4) return "Minimal anxiety";
    if (score <= 9) return "Mild anxiety";
    if (score <= 14) return "Moderate anxiety";
    return "Severe anxiety";
  };

  const getMeq4Interpretation = (score: number | null): string => {
    if (score === null) return "Not assessed";
    if (score <= 4) return "Minimal";
    if (score <= 8) return "Low";
    if (score <= 12) return "Moderate";
    if (score <= 16) return "Strong";
    return "Complete";
  };

  const getCeq7Interpretation = (score: number | null): string => {
    if (score === null) return "Not assessed";
    if (score <= 7) return "Minimal";
    if (score <= 14) return "Mild";
    if (score <= 21) return "Moderate";
    return "Intense";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Assessment Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const moodDelta = assessment.mood_post !== null && assessment.mood_pre !== null 
    ? assessment.mood_post - assessment.mood_pre 
    : null;

  const getMoodTrend = (delta: number | null) => {
    if (delta === null) return { icon: Minus, color: 'text-muted-foreground', label: 'No change' };
    if (delta > 0) return { icon: TrendingUp, color: 'text-green-500', label: `+${delta} improvement` };
    if (delta < 0) return { icon: TrendingDown, color: 'text-destructive', label: `${delta} decline` };
    return { icon: Minus, color: 'text-muted-foreground', label: 'No change' };
  };

  const moodTrend = getMoodTrend(moodDelta);
  const TrendIcon = moodTrend.icon;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shared Assessment Report | DMT Code Project</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Shared Assessment Report</h1>
            <p className="text-sm text-muted-foreground">
              De-identified report shared on {new Date(assessment.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Privacy Protected</p>
              <p className="text-muted-foreground">
                This is a de-identified assessment report. Personal information has been removed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mood Delta */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendIcon className={`h-5 w-5 ${moodTrend.color}`} />
              Mood Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-3xl font-bold">{assessment.mood_pre ?? '—'}</p>
                <p className="text-sm text-muted-foreground">Pre-Session</p>
              </div>
              <div className="flex-1 mx-8">
                <Progress 
                  value={((assessment.mood_post ?? 0) / 10) * 100} 
                  className="h-2"
                />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{assessment.mood_post ?? '—'}</p>
                <p className="text-sm text-muted-foreground">Post-Session</p>
              </div>
            </div>
            <p className={`text-center mt-4 font-medium ${moodTrend.color}`}>
              {moodTrend.label}
            </p>
          </CardContent>
        </Card>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">PHQ-9 Depression</CardTitle>
              <CardDescription>Patient Health Questionnaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{assessment.phq9_score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/27</span>
              </div>
              <Progress value={((assessment.phq9_score ?? 0) / 27) * 100} className="h-2 mb-2" />
              <Badge variant="secondary">{getPhq9Interpretation(assessment.phq9_score)}</Badge>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">GAD-7 Anxiety</CardTitle>
              <CardDescription>Generalized Anxiety Disorder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{assessment.gad7_score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/21</span>
              </div>
              <Progress value={((assessment.gad7_score ?? 0) / 21) * 100} className="h-2 mb-2" />
              <Badge variant="secondary">{getGad7Interpretation(assessment.gad7_score)}</Badge>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">MEQ-4 Experience</CardTitle>
              <CardDescription>Mystical Experience Questionnaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{assessment.meq4_score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/20</span>
              </div>
              <Progress value={((assessment.meq4_score ?? 0) / 20) * 100} className="h-2 mb-2" />
              <Badge variant="secondary">{getMeq4Interpretation(assessment.meq4_score)}</Badge>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">CEQ-7 Challenging</CardTitle>
              <CardDescription>Challenging Experience Questionnaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{assessment.ceq7_score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/28</span>
              </div>
              <Progress value={((assessment.ceq7_score ?? 0) / 28) * 100} className="h-2 mb-2" />
              <Badge variant="secondary">{getCeq7Interpretation(assessment.ceq7_score)}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Transcript */}
        {assessment.voice_logs?.transcript && (
          <Card className="mb-6 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {assessment.voice_logs.transcript}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Open Questions */}
        {assessment.context_jsonb?.open_questions && (
          <Card className="mb-6 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Reflections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.context_jsonb.open_questions.insights && (
                <div>
                  <p className="font-medium text-sm">Key Insights</p>
                  <p className="text-muted-foreground">{assessment.context_jsonb.open_questions.insights}</p>
                </div>
              )}
              {assessment.context_jsonb.open_questions.challenges && (
                <div>
                  <p className="font-medium text-sm">Challenges</p>
                  <p className="text-muted-foreground">{assessment.context_jsonb.open_questions.challenges}</p>
                </div>
              )}
              {assessment.context_jsonb.open_questions.integration_goals && (
                <div>
                  <p className="font-medium text-sm">Integration Goals</p>
                  <p className="text-muted-foreground">{assessment.context_jsonb.open_questions.integration_goals}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          This report is for informational purposes only. Not a substitute for professional medical advice.
        </p>
      </main>

      <Footer />
    </div>
  );
}
