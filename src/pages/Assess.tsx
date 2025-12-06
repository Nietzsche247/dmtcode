import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AssessmentForm } from '@/components/assessment/AssessmentForm';
import { ReportViewer } from '@/components/assessment/ReportViewer';
import { BrainScanUpload } from '@/components/assessment/BrainScanUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, FileText, Image, ArrowRight, Brain } from 'lucide-react';
import { usePostHogTracking } from '@/hooks/usePostHogTracking';

export default function Assess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const logId = searchParams.get('log_id');
  const [activeTab, setActiveTab] = useState<'form' | 'report' | 'scan'>('form');
  const [completedAssessmentId, setCompletedAssessmentId] = useState<string | null>(null);
  const { trackPageView } = usePostHogTracking();

  useEffect(() => {
    trackPageView('assess', { log_id: logId });
  }, []);

  const handleAssessmentComplete = (assessmentId: string) => {
    setCompletedAssessmentId(assessmentId);
    setActiveTab('report');
    
    // Track completion
    if (window.posthog) {
      window.posthog.capture('assessment_completed', {
        assessment_id: assessmentId,
        log_id: logId
      });
    }
  };

  const handleScanUpload = (url: string) => {
    if (window.posthog) {
      window.posthog.capture('scan_uploaded', {
        assessment_id: completedAssessmentId
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Psychedelic Experience Assessment Tool | DMT Code</title>
        <meta name="description" content="Clinician-ready validated assessment using PHQ-9, GAD-7, MEQ-4 instruments with AI-powered integration guidance." />
        <link rel="canonical" href="https://dmtcode.com/assess" />
        <meta property="og:title" content="Psychedelic Experience Assessment Tool | DMT Code" />
        <meta property="og:description" content="Clinician-ready validated assessment using PHQ-9, GAD-7, MEQ-4 instruments with AI-powered integration guidance." />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
              { "@type": "ListItem", "position": 2, "name": "Assessment", "item": "https://dmtcode.com/assess" }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Psychedelic Experience Assessment",
            "description": "Clinical assessment tools including PHQ-9, GAD-7, MEQ-4, and CEQ-7 for psychedelic therapy sessions",
            "mainEntity": {
              "@type": "MedicalTest",
              "name": "Psychedelic Experience Assessment Battery",
              "usedToDiagnose": "Mental health screening",
              "relevantSpecialty": "Psychiatry"
            }
          })}
        </script>
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Brain className="h-4 w-4" />
            Clinical Assessment
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Experience Assessment
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Validated clinical instruments for pre/post-session evaluation. 
            Secure, de-identified sharing with healthcare providers.
          </p>
        </div>

        {/* Quick Start Card */}
        {!completedAssessmentId && !logId && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Start with Voice Logger</h3>
                    <p className="text-sm text-muted-foreground">
                      Record your experience first, then complete the assessment
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/log')} className="whitespace-nowrap">
                  Go to Voice Logger
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {completedAssessmentId ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 mb-6">
              <TabsTrigger value="form" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Assessment
              </TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4 mr-2" />
                Report
              </TabsTrigger>
              <TabsTrigger value="scan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Image className="h-4 w-4 mr-2" />
                Brain Scan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <AssessmentForm logId={logId || undefined} onComplete={handleAssessmentComplete} />
            </TabsContent>

            <TabsContent value="report">
              <ReportViewer assessmentId={completedAssessmentId} />
            </TabsContent>

            <TabsContent value="scan">
              <BrainScanUpload 
                assessmentId={completedAssessmentId} 
                onUploadComplete={handleScanUpload}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <AssessmentForm logId={logId || undefined} onComplete={handleAssessmentComplete} />
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PHQ-9 & GAD-7</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Validated screening tools for depression and anxiety used in clinical settings worldwide.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">MEQ-4 & CEQ-7</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Specialized instruments for measuring experience quality and challenging aspects.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Secure Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Generate de-identified reports for your therapist or healthcare provider.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
