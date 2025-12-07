import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePostHogTracking } from '@/hooks/usePostHogTracking';

interface AssessmentFormProps {
  logId?: string;
  onComplete: (assessmentId: string) => void;
}

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly, or being fidgety or restless",
  "Thoughts that you would be better off dead or of hurting yourself"
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const MEQ4_QUESTIONS = [
  "Experience of unity with ultimate reality",
  "Sense of sacredness or reverence",
  "Noetic quality (sense of encountering ultimate truth)",
  "Positive mood (peace, joy, love)"
];

const CEQ7_QUESTIONS = [
  "Fear or anxiety",
  "Grief or sadness",
  "Physical distress",
  "Insanity or losing one's mind",
  "Isolation or loneliness",
  "Death or dying",
  "Paranoia"
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
];

const INTENSITY_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "Slight" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Strong" },
  { value: 4, label: "Extreme" }
];

export function AssessmentForm({ logId, onComplete }: AssessmentFormProps) {
  const [activeTab, setActiveTab] = useState('pre');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackAssessmentSubmitted } = usePostHogTracking();
  
  // Pre-session state
  const [moodPre, setMoodPre] = useState([5]);
  const [phq9Responses, setPhq9Responses] = useState<number[]>(new Array(9).fill(-1));
  const [gad7Responses, setGad7Responses] = useState<number[]>(new Array(7).fill(-1));
  
  // Post-session state
  const [moodPost, setMoodPost] = useState([5]);
  const [meq4Responses, setMeq4Responses] = useState<number[]>(new Array(4).fill(-1));
  const [ceq7Responses, setCeq7Responses] = useState<number[]>(new Array(7).fill(-1));
  const [openQuestions, setOpenQuestions] = useState({
    insights: '',
    challenges: '',
    integration_goals: ''
  });

  const handlePhq9Change = (index: number, value: number) => {
    const newResponses = [...phq9Responses];
    newResponses[index] = value;
    setPhq9Responses(newResponses);
  };

  const handleGad7Change = (index: number, value: number) => {
    const newResponses = [...gad7Responses];
    newResponses[index] = value;
    setGad7Responses(newResponses);
  };

  const handleMeq4Change = (index: number, value: number) => {
    const newResponses = [...meq4Responses];
    newResponses[index] = value;
    setMeq4Responses(newResponses);
  };

  const handleCeq7Change = (index: number, value: number) => {
    const newResponses = [...ceq7Responses];
    newResponses[index] = value;
    setCeq7Responses(newResponses);
  };

  const isPreComplete = phq9Responses.every(r => r >= 0) && gad7Responses.every(r => r >= 0);
  const isPostComplete = meq4Responses.every(r => r >= 0) && ceq7Responses.every(r => r >= 0);

  // Calculate real-time PHQ-9 score (0-27)
  const phq9Score = phq9Responses.filter(r => r >= 0).reduce((sum, r) => sum + r, 0);
  const phq9Answered = phq9Responses.filter(r => r >= 0).length;
  
  // Calculate real-time GAD-7 score (0-21)
  const gad7Score = gad7Responses.filter(r => r >= 0).reduce((sum, r) => sum + r, 0);
  const gad7Answered = gad7Responses.filter(r => r >= 0).length;

  // Calculate real-time MEQ-4 score (0-16)
  const meq4Score = meq4Responses.filter(r => r >= 0).reduce((sum, r) => sum + r, 0);
  const meq4Answered = meq4Responses.filter(r => r >= 0).length;

  // Calculate real-time CEQ-7 score (0-28)
  const ceq7Score = ceq7Responses.filter(r => r >= 0).reduce((sum, r) => sum + r, 0);
  const ceq7Answered = ceq7Responses.filter(r => r >= 0).length;

  // Severity interpretation functions
  const getPhq9Severity = (score: number): { label: string; color: string } => {
    if (score <= 4) return { label: 'Minimal', color: 'text-green-500' };
    if (score <= 9) return { label: 'Mild', color: 'text-yellow-500' };
    if (score <= 14) return { label: 'Moderate', color: 'text-orange-500' };
    if (score <= 19) return { label: 'Moderately Severe', color: 'text-orange-600' };
    return { label: 'Severe', color: 'text-red-500' };
  };

  const getGad7Severity = (score: number): { label: string; color: string } => {
    if (score <= 4) return { label: 'Minimal', color: 'text-green-500' };
    if (score <= 9) return { label: 'Mild', color: 'text-yellow-500' };
    if (score <= 14) return { label: 'Moderate', color: 'text-orange-500' };
    return { label: 'Severe', color: 'text-red-500' };
  };

  const getMeq4Severity = (score: number): { label: string; color: string } => {
    if (score <= 4) return { label: 'Minimal', color: 'text-muted-foreground' };
    if (score <= 8) return { label: 'Moderate', color: 'text-blue-500' };
    if (score <= 12) return { label: 'Strong', color: 'text-purple-500' };
    return { label: 'Complete', color: 'text-primary' };
  };

  const getCeq7Severity = (score: number): { label: string; color: string } => {
    if (score <= 7) return { label: 'Minimal', color: 'text-green-500' };
    if (score <= 14) return { label: 'Moderate', color: 'text-yellow-500' };
    if (score <= 21) return { label: 'Significant', color: 'text-orange-500' };
    return { label: 'Severe', color: 'text-red-500' };
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (activeTab === 'pre') {
      // Pre-session: PHQ-9 (9 questions) + GAD-7 (7 questions) = 16 total
      return Math.round(((phq9Answered + gad7Answered) / 16) * 100);
    } else {
      // Post-session: MEQ-4 (4 questions) + CEQ-7 (7 questions) = 11 total
      return Math.round(((meq4Answered + ceq7Answered) / 11) * 100);
    }
  };

  const progress = calculateProgress();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: user?.id || null,
          log_id: logId || null,
          mood_pre: moodPre[0],
          mood_post: moodPost[0],
          context_jsonb: {
            phq9_responses: phq9Responses,
            gad7_responses: gad7Responses,
            meq4_responses: meq4Responses,
            ceq7_responses: ceq7Responses,
            open_questions: openQuestions
          }
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Score the assessment via edge function
      const { data: scoreResult, error: scoreError } = await supabase.functions.invoke('assess-score', {
        body: {
          action: 'score_assessment',
          assessment_id: assessment.id,
          responses: {
            phq9: phq9Responses,
            gad7: gad7Responses,
            meq4: meq4Responses,
            ceq7: ceq7Responses,
            context: openQuestions
          }
        }
      });

      if (scoreError) throw scoreError;

      // Link assessment to voice log if provided
      if (logId) {
        await supabase
          .from('voice_logs')
          .update({ assessment_id: assessment.id })
          .eq('id', logId);
      }

      // Track assessment submission
      trackAssessmentSubmitted({
        assessment_id: assessment.id,
        has_log_id: !!logId,
        phq9_score: scoreResult?.phq9_score,
        gad7_score: scoreResult?.gad7_score,
        mood_pre: moodPre[0],
        mood_post: moodPost[0]
      });

      toast.success('Assessment completed successfully');
      onComplete(assessment.id);
      
    } catch (error) {
      console.error('Assessment error:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {activeTab === 'pre' ? 'Pre-Session' : 'Post-Session'} Progress
          </span>
          <span className={progress === 100 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
            {progress}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="pre" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Pre-Session Baseline
            {isPreComplete && <span className="ml-2 text-xs">✓</span>}
          </TabsTrigger>
          <TabsTrigger value="post" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Post-Session Assessment
            {isPostComplete && <span className="ml-2 text-xs">✓</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre" className="space-y-6 mt-6">
          {/* Mood Scale */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Current Mood</CardTitle>
              <CardDescription>Rate your current mood on a scale of 0-10</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={moodPre}
                  onValueChange={setMoodPre}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0 - Very Low</span>
                  <span className="font-bold text-foreground">{moodPre[0]}</span>
                  <span>10 - Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PHQ-9 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">PHQ-9 Depression Screen</CardTitle>
                  <CardDescription>Over the last 2 weeks, how often have you been bothered by:</CardDescription>
                </div>
                {phq9Answered > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{phq9Score}</div>
                    <div className={`text-sm font-medium ${getPhq9Severity(phq9Score).color}`}>
                      {getPhq9Severity(phq9Score).label}
                    </div>
                    <div className="text-xs text-muted-foreground">{phq9Answered}/9 answered</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {PHQ9_QUESTIONS.map((question, index) => (
                <div key={`phq9-${index}`} className="space-y-3">
                  <Label className="text-sm font-medium">{index + 1}. {question}</Label>
                  <RadioGroup
                    value={phq9Responses[index] >= 0 ? phq9Responses[index].toString() : undefined}
                    onValueChange={(val) => handlePhq9Change(index, parseInt(val))}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2"
                  >
                    {RESPONSE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value.toString()} id={`phq9-${index}-${option.value}`} />
                        <Label htmlFor={`phq9-${index}-${option.value}`} className="text-xs cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* GAD-7 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">GAD-7 Anxiety Screen</CardTitle>
                  <CardDescription>Over the last 2 weeks, how often have you been bothered by:</CardDescription>
                </div>
                {gad7Answered > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{gad7Score}</div>
                    <div className={`text-sm font-medium ${getGad7Severity(gad7Score).color}`}>
                      {getGad7Severity(gad7Score).label}
                    </div>
                    <div className="text-xs text-muted-foreground">{gad7Answered}/7 answered</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {GAD7_QUESTIONS.map((question, index) => (
                <div key={`gad7-${index}`} className="space-y-3">
                  <Label className="text-sm font-medium">{index + 1}. {question}</Label>
                  <RadioGroup
                    value={gad7Responses[index] >= 0 ? gad7Responses[index].toString() : undefined}
                    onValueChange={(val) => handleGad7Change(index, parseInt(val))}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2"
                  >
                    {RESPONSE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value.toString()} id={`gad7-${index}-${option.value}`} />
                        <Label htmlFor={`gad7-${index}-${option.value}`} className="text-xs cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setActiveTab('post')}
              disabled={!isPreComplete}
              className="bg-primary hover:bg-primary/90"
            >
              Continue to Post-Session →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="post" className="space-y-6 mt-6">
          {/* Post-Session Mood */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Post-Session Mood</CardTitle>
              <CardDescription>Rate your current mood after the session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={moodPost}
                  onValueChange={setMoodPost}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0 - Very Low</span>
                  <span className="font-bold text-foreground">{moodPost[0]}</span>
                  <span>10 - Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MEQ-4 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">MEQ-4 Experience Quality</CardTitle>
                  <CardDescription>Rate the intensity of each experience dimension:</CardDescription>
                </div>
                {meq4Answered > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{meq4Score}</div>
                    <div className={`text-sm font-medium ${getMeq4Severity(meq4Score).color}`}>
                      {getMeq4Severity(meq4Score).label}
                    </div>
                    <div className="text-xs text-muted-foreground">{meq4Answered}/4 answered</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {MEQ4_QUESTIONS.map((question, index) => (
                <div key={`meq4-${index}`} className="space-y-3">
                  <Label className="text-sm font-medium">{index + 1}. {question}</Label>
                  <RadioGroup
                    value={meq4Responses[index] >= 0 ? meq4Responses[index].toString() : undefined}
                    onValueChange={(val) => handleMeq4Change(index, parseInt(val))}
                    className="grid grid-cols-3 md:grid-cols-5 gap-2"
                  >
                    {INTENSITY_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value.toString()} id={`meq4-${index}-${option.value}`} />
                        <Label htmlFor={`meq4-${index}-${option.value}`} className="text-xs cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CEQ-7 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">CEQ-7 Challenging Experiences</CardTitle>
                  <CardDescription>Rate the intensity of any challenging experiences:</CardDescription>
                </div>
                {ceq7Answered > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{ceq7Score}</div>
                    <div className={`text-sm font-medium ${getCeq7Severity(ceq7Score).color}`}>
                      {getCeq7Severity(ceq7Score).label}
                    </div>
                    <div className="text-xs text-muted-foreground">{ceq7Answered}/7 answered</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {CEQ7_QUESTIONS.map((question, index) => (
                <div key={`ceq7-${index}`} className="space-y-3">
                  <Label className="text-sm font-medium">{index + 1}. {question}</Label>
                  <RadioGroup
                    value={ceq7Responses[index] >= 0 ? ceq7Responses[index].toString() : undefined}
                    onValueChange={(val) => handleCeq7Change(index, parseInt(val))}
                    className="grid grid-cols-3 md:grid-cols-5 gap-2"
                  >
                    {INTENSITY_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value.toString()} id={`ceq7-${index}-${option.value}`} />
                        <Label htmlFor={`ceq7-${index}-${option.value}`} className="text-xs cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Open Questions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Reflection Questions</CardTitle>
              <CardDescription>Optional: Share your insights and integration goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Key insights from the session</Label>
                <Textarea
                  value={openQuestions.insights}
                  onChange={(e) => setOpenQuestions(prev => ({ ...prev, insights: e.target.value }))}
                  placeholder="What did you learn or realize during this experience?"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Challenges encountered</Label>
                <Textarea
                  value={openQuestions.challenges}
                  onChange={(e) => setOpenQuestions(prev => ({ ...prev, challenges: e.target.value }))}
                  placeholder="Were there any difficult moments? How did you navigate them?"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Integration goals</Label>
                <Textarea
                  value={openQuestions.integration_goals}
                  onChange={(e) => setOpenQuestions(prev => ({ ...prev, integration_goals: e.target.value }))}
                  placeholder="What would you like to carry forward from this experience?"
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assessment Summary Card */}
          {(isPreComplete || isPostComplete) && (
            <Card className="border-primary/30 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Assessment Summary
                </CardTitle>
                <CardDescription>Your scores across all assessment scales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* PHQ-9 */}
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">PHQ-9</div>
                    <div className="text-3xl font-bold">{phq9Answered === 9 ? phq9Score : '—'}</div>
                    {phq9Answered === 9 ? (
                      <div className={`text-xs font-medium ${getPhq9Severity(phq9Score).color}`}>
                        {getPhq9Severity(phq9Score).label}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">{phq9Answered}/9</div>
                    )}
                  </div>

                  {/* GAD-7 */}
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">GAD-7</div>
                    <div className="text-3xl font-bold">{gad7Answered === 7 ? gad7Score : '—'}</div>
                    {gad7Answered === 7 ? (
                      <div className={`text-xs font-medium ${getGad7Severity(gad7Score).color}`}>
                        {getGad7Severity(gad7Score).label}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">{gad7Answered}/7</div>
                    )}
                  </div>

                  {/* MEQ-4 */}
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">MEQ-4</div>
                    <div className="text-3xl font-bold">{meq4Answered === 4 ? meq4Score : '—'}</div>
                    {meq4Answered === 4 ? (
                      <div className={`text-xs font-medium ${getMeq4Severity(meq4Score).color}`}>
                        {getMeq4Severity(meq4Score).label}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">{meq4Answered}/4</div>
                    )}
                  </div>

                  {/* CEQ-7 */}
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">CEQ-7</div>
                    <div className="text-3xl font-bold">{ceq7Answered === 7 ? ceq7Score : '—'}</div>
                    {ceq7Answered === 7 ? (
                      <div className={`text-xs font-medium ${getCeq7Severity(ceq7Score).color}`}>
                        {getCeq7Severity(ceq7Score).label}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">{ceq7Answered}/7</div>
                    )}
                  </div>
                </div>

                {/* Mood Comparison */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground">Pre-Session Mood</div>
                      <div className="text-2xl font-bold">{moodPre[0]}/10</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Post-Session Mood</div>
                      <div className="text-2xl font-bold">{moodPost[0]}/10</div>
                    </div>
                    <div className={`text-center px-3 py-1 rounded-full text-sm font-medium ${
                      moodPost[0] > moodPre[0] 
                        ? 'bg-green-500/20 text-green-500' 
                        : moodPost[0] < moodPre[0] 
                          ? 'bg-red-500/20 text-red-500' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {moodPost[0] > moodPre[0] 
                        ? `+${moodPost[0] - moodPre[0]}` 
                        : moodPost[0] < moodPre[0] 
                          ? `${moodPost[0] - moodPre[0]}` 
                          : 'No change'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setActiveTab('pre')}
            >
              ← Back to Pre-Session
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isPostComplete || isSubmitting}
              className="bg-primary hover:bg-primary/90 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
