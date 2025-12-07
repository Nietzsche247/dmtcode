import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Share2, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TherapistShareModal } from './TherapistShareModal';
import { AssessmentTrends } from './AssessmentTrends';
import { usePostHogTracking } from '@/hooks/usePostHogTracking';

interface ReportViewerProps {
  assessmentId: string;
}

interface AssessmentData {
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
    archetype_matches: any;
  };
}

interface ReportData {
  scores: {
    phq9: { score: number | null; interpretation: string };
    gad7: { score: number | null; interpretation: string };
    meq4: { score: number | null; interpretation: string };
    ceq7: { score: number | null; interpretation: string };
  };
  mood: {
    pre: number | null;
    post: number | null;
    delta: number | null;
  };
  transcript: string | null;
  context: any;
}

export function ReportViewer({ assessmentId }: ReportViewerProps) {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { trackReportGenerated, trackTherapistShareClicked } = usePostHogTracking();

  useEffect(() => {
    loadReport();
  }, [assessmentId]);

  const loadReport = async () => {
    try {
      // Fetch assessment data
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          voice_logs (
            transcript,
            duration_seconds,
            archetype_matches
          )
        `)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      setAssessment(data);

      // Generate report via edge function
      const { data: reportData, error: reportError } = await supabase.functions.invoke('assess-score', {
        body: {
          action: 'generate_report',
          assessment_id: assessmentId
        }
      });

      if (reportError) throw reportError;
      setReport(reportData.report);

      // Track report generation
      trackReportGenerated({
        assessment_id: assessmentId,
        phq9_score: reportData.report?.scores?.phq9?.score,
        gad7_score: reportData.report?.scores?.gad7?.score,
        mood_delta: reportData.report?.mood?.delta
      });

    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Failed to load assessment report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    // Generate printable report
    const printContent = document.getElementById('report-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Assessment Report - ${new Date().toLocaleDateString()}</title>
              <style>
                body { font-family: Inter, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #0f172a; font-size: 24px; }
                h2 { color: #374151; font-size: 18px; margin-top: 24px; }
                .score-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 8px 0; }
                .score-value { font-size: 32px; font-weight: bold; color: #C41E3A; }
                .interpretation { color: #6b7280; font-size: 14px; }
                .mood-delta { font-size: 18px; margin: 16px 0; }
                .positive { color: #10b981; }
                .negative { color: #ef4444; }
                .neutral { color: #6b7280; }
              </style>
            </head>
            <body>
              <h1>Psychedelic Experience Assessment Report</h1>
              <p>Generated: ${new Date().toLocaleString()}</p>
              <p>Assessment ID: ${assessmentId.slice(0, 8)}...</p>
              
              <h2>Depression Screen (PHQ-9)</h2>
              <div class="score-card">
                <div class="score-value">${report?.scores.phq9.score ?? 'N/A'}/27</div>
                <div class="interpretation">${report?.scores.phq9.interpretation}</div>
              </div>
              
              <h2>Anxiety Screen (GAD-7)</h2>
              <div class="score-card">
                <div class="score-value">${report?.scores.gad7.score ?? 'N/A'}/21</div>
                <div class="interpretation">${report?.scores.gad7.interpretation}</div>
              </div>
              
              <h2>Experience Quality (MEQ-4)</h2>
              <div class="score-card">
                <div class="score-value">${report?.scores.meq4.score ?? 'N/A'}/20</div>
                <div class="interpretation">${report?.scores.meq4.interpretation}</div>
              </div>
              
              <h2>Challenging Experiences (CEQ-7)</h2>
              <div class="score-card">
                <div class="score-value">${report?.scores.ceq7.score ?? 'N/A'}/28</div>
                <div class="interpretation">${report?.scores.ceq7.interpretation}</div>
              </div>
              
              <h2>Mood Change</h2>
              <div class="mood-delta ${(report?.mood.delta ?? 0) > 0 ? 'positive' : (report?.mood.delta ?? 0) < 0 ? 'negative' : 'neutral'}">
                Pre: ${report?.mood.pre ?? 'N/A'}/10 → Post: ${report?.mood.post ?? 'N/A'}/10
                (${(report?.mood.delta ?? 0) > 0 ? '+' : ''}${report?.mood.delta ?? 'N/A'})
              </div>
              
              ${report?.transcript ? `
                <h2>Session Transcript</h2>
                <p>${report.transcript}</p>
              ` : ''}
              
              <p style="margin-top: 40px; color: #9ca3af; font-size: 12px;">
                This report is for informational purposes only and should not be used as a substitute for professional medical advice.
              </p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    toast.success('Report opened for printing');
  };

  const getMoodTrend = (delta: number | null) => {
    if (delta === null) return { icon: Minus, color: 'text-muted-foreground', label: 'No change' };
    if (delta > 0) return { icon: TrendingUp, color: 'text-green-500', label: `+${delta} improvement` };
    if (delta < 0) return { icon: TrendingDown, color: 'text-destructive', label: `${delta} decline` };
    return { icon: Minus, color: 'text-muted-foreground', label: 'No change' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Generating assessment report...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !report) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Failed to load assessment report</p>
        </CardContent>
      </Card>
    );
  }

  const moodTrend = getMoodTrend(report.mood.delta);
  const TrendIcon = moodTrend.icon;

  return (
    <div className="space-y-6" id="report-content">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Assessment Report</h2>
          <p className="text-muted-foreground text-sm">
            Generated {new Date(assessment.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share with Therapist
          </Button>
        </div>
      </div>

      {/* Mood Delta Card */}
      <Card className="border-border/50 bg-gradient-to-r from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendIcon className={`h-5 w-5 ${moodTrend.color}`} />
            Mood Change
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-3xl font-bold">{report.mood.pre ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Pre-Session</p>
            </div>
            <div className="flex-1 mx-8">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${report.mood.delta && report.mood.delta > 0 ? 'bg-green-500' : report.mood.delta && report.mood.delta < 0 ? 'bg-destructive' : 'bg-muted-foreground'}`}
                  style={{ width: `${((report.mood.post ?? 0) / 10) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{report.mood.post ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Post-Session</p>
            </div>
          </div>
          <p className={`text-center mt-4 font-medium ${moodTrend.color}`}>
            {moodTrend.label}
          </p>
        </CardContent>
      </Card>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PHQ-9 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">PHQ-9 Depression</CardTitle>
            <CardDescription>Patient Health Questionnaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{report.scores.phq9.score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/27</span>
              </div>
              <Progress value={((report.scores.phq9.score ?? 0) / 27) * 100} className="h-2" />
              <Badge variant="secondary" className="mt-2">
                {report.scores.phq9.interpretation}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* GAD-7 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">GAD-7 Anxiety</CardTitle>
            <CardDescription>Generalized Anxiety Disorder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{report.scores.gad7.score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/21</span>
              </div>
              <Progress value={((report.scores.gad7.score ?? 0) / 21) * 100} className="h-2" />
              <Badge variant="secondary" className="mt-2">
                {report.scores.gad7.interpretation}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* MEQ-4 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">MEQ-4 Experience Quality</CardTitle>
            <CardDescription>Mystical Experience Questionnaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{report.scores.meq4.score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/20</span>
              </div>
              <Progress value={((report.scores.meq4.score ?? 0) / 20) * 100} className="h-2" />
              <Badge variant="secondary" className="mt-2">
                {report.scores.meq4.interpretation}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* CEQ-7 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">CEQ-7 Challenging</CardTitle>
            <CardDescription>Challenging Experience Questionnaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{report.scores.ceq7.score ?? '—'}</span>
                <span className="text-muted-foreground mb-1">/28</span>
              </div>
              <Progress value={((report.scores.ceq7.score ?? 0) / 28) * 100} className="h-2" />
              <Badge variant="secondary" className="mt-2">
                {report.scores.ceq7.interpretation}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      {report.transcript && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Session Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{report.transcript}</p>
          </CardContent>
        </Card>
      )}

      {/* Open Questions */}
      {report.context?.open_questions && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Reflections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.context.open_questions.insights && (
              <div>
                <p className="font-medium text-sm">Key Insights</p>
                <p className="text-muted-foreground">{report.context.open_questions.insights}</p>
              </div>
            )}
            {report.context.open_questions.challenges && (
              <div>
                <p className="font-medium text-sm">Challenges</p>
                <p className="text-muted-foreground">{report.context.open_questions.challenges}</p>
              </div>
            )}
            {report.context.open_questions.integration_goals && (
              <div>
                <p className="font-medium text-sm">Integration Goals</p>
                <p className="text-muted-foreground">{report.context.open_questions.integration_goals}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Trends */}
      <AssessmentTrends currentAssessmentId={assessmentId} />

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        This report is for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
      </p>

      <TherapistShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        assessmentId={assessmentId}
      />
    </div>
  );
}
