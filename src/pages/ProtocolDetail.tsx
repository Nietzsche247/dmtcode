import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContentTranslations, overlay } from '@/hooks/useContentTranslations';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { FollowButton } from '@/components/FollowButton';

import { 
  FlaskConical, Stethoscope, Clock, ArrowLeft, Mic, 
  BookOpen, Shield, Pill, Brain, FileText, ExternalLink,
  AlertTriangle, CheckCircle2, Activity, Download, ClipboardList
} from 'lucide-react';

const statusConfig = {
  clinical: { label: 'Clinical', color: 'bg-green-500', icon: Stethoscope },
  research: { label: 'Research', color: 'bg-blue-500', icon: FlaskConical },
  coming_soon: { label: 'Coming Soon', color: 'bg-muted', icon: Clock },
};

const ProtocolDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const locale = useLocale();

  const { data: protocol, isLoading, error } = useQuery({
    queryKey: ['protocol', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Protocol not found');
      return data;
    }
  });

  const translations = useContentTranslations('protocols', slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/2"></div>
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Protocol Not Found</h1>
          <p className="text-muted-foreground mb-8">This protocol doesn't exist or hasn't been published yet.</p>
          <Link to="/protocols">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Protocols
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // protocols are keyed by slug in content_translations. content_jsonb is
  // replaced whole, exactly as the prerender overlay does.
  const shown = (overlay(
    protocol as unknown as Record<string, unknown>,
    translations,
    ['title', 'tagline', 'content_jsonb'],
  ) ?? protocol) as any;
  const canonicalUrl = `https://dmtcode.com${localePath(locale, `/protocols/${protocol.slug}`)}`;

  const content = shown.content_jsonb as any || {};
  const status = statusConfig[protocol.status as keyof typeof statusConfig] || statusConfig.coming_soon;
  const StatusIcon = status.icon;
  const isClinicalMode = content.clinical_mode === true;
  const showDosing = Array.isArray(content.dosing) && content.dosing.length > 0;
  const showControlsRigor = content.controls_and_rigor != null;
  // The dmt-laser set/setting copy in the database describes the laser without
  // naming the diffraction grating in the beam path; render that detail here
  // rather than depending on a database edit.
  const setSettingText = content.preparation?.set_setting
    ? (protocol.slug === 'dmt-laser' && !/diffraction grating/i.test(content.preparation.set_setting)
        ? `${content.preparation.set_setting} A diffraction grating sits in the beam path.`
        : content.preparation.set_setting)
    : content.preparation?.set_setting;

  const card_overview = (
    <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Clinical Overview</h2>
                  {content.overview ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Indications</h3>
                        <div className="flex flex-wrap gap-2">
                          {content.overview.indications?.map((ind: string, i: number) => (
                            <Badge key={i} variant="secondary">{ind}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Evidence Level</h3>
                        <p className="text-muted-foreground">{content.overview.evidence_level}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Mechanism of Action</h3>
                        <p className="text-muted-foreground">{content.overview.mechanism}</p>
                      </div>
                      {content.overview.contraindications && (
                        <div>
                          <h3 className="font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Contraindications
                          </h3>
                          <ul className="space-y-1">
                            {content.overview.contraindications.map((item: string, i: number) => (
                              <li key={i} className="text-muted-foreground text-sm flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Overview documentation coming soon.</p>
                  )}
                </Card>
  );

  const card_preparation = (
    <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Preparation & Screening</h2>
                  {content.preparation ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Clinical Setting Requirements</h3>
                        <p className="text-muted-foreground">{setSettingText}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Screening Checklist</h3>
                        <ul className="space-y-2">
                          {content.preparation.screening?.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {content.preparation.consent_template && (
                        <div>
                          <h3 className="font-medium mb-2">Informed Consent</h3>
                          <p className="text-muted-foreground text-sm">{content.preparation.consent_template}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Preparation guidelines coming soon.</p>
                  )}
                </Card>
  );

  const card_dosing = (
    <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Dosing Protocols</h2>
                  {content.dosing && content.dosing.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Route</th>
                            <th className="text-left py-3 px-4 font-medium">Dose</th>
                            <th className="text-left py-3 px-4 font-medium">Duration</th>
                            <th className="text-left py-3 px-4 font-medium">Protocol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.dosing.map((row: any, i: number) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-3 px-4">{row.route}</td>
                              <td className="py-3 px-4 font-mono text-primary">{row.dose}</td>
                              <td className="py-3 px-4">{row.duration}</td>
                              <td className="py-3 px-4 text-muted-foreground">{row.sessions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Dosing information coming soon.</p>
                  )}
                </Card>
  );

  const card_session = (
    <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Session Execution</h2>
                    {content.session_execution ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-3">Session Timeline</h3>
                          <div className="space-y-2">
                            {content.session_execution.timeline?.map((step: string, i: number) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                  {i + 1}
                                </div>
                                <span className="text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Vital Signs Monitoring</h3>
                          <p className="text-muted-foreground text-sm">{content.session_execution.monitoring}</p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Music Recommendations</h3>
                          <p className="text-muted-foreground text-sm">{content.session_execution.music}</p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Environment</h3>
                          <p className="text-muted-foreground text-sm">{content.session_execution.environment}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Session execution guidelines coming soon.</p>
                    )}
                  </Card>
  );

  const card_voice_logger = (
    <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Therapeutic Voice Logging</h2>
                    {content.voice_logger_integration ? (
                      <div className="space-y-6">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <h3 className="font-medium mb-2 flex items-center gap-2 text-green-600">
                            <Stethoscope className="w-4 h-4" />
                            Clinical Mode Active
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Voice logger uses therapeutic theme detection instead of visual pattern matching. 
                            All recordings are exportable as PDF reports for patient charts.
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Therapeutic Theme Detection</h3>
                          <div className="flex flex-wrap gap-2">
                            {content.voice_logger_integration.theme_detection_labels?.map((theme: string, i: number) => (
                              <Badge key={i} variant="outline" className="capitalize">{theme}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Session Prompts</h3>
                          <ul className="space-y-2">
                            {content.voice_logger_integration.prompts?.map((prompt: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                "{prompt}"
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {content.voice_logger_integration.pre_session_mood_scale && (
                            <Badge variant="secondary">Pre-Session Mood Scale (0-10)</Badge>
                          )}
                          {content.voice_logger_integration.post_session_mood_scale && (
                            <Badge variant="secondary">Post-Session Mood Scale (0-10)</Badge>
                          )}
                          {content.voice_logger_integration.export_pdf && (
                            <Badge variant="secondary">PDF Export for Patient Chart</Badge>
                          )}
                        </div>

                        <div className="pt-4">
                          <Link to={`/log?protocol=${protocol.slug}`}>
                            <Button className="gap-2">
                              <Mic className="w-4 h-4" />
                              Start Clinical Voice Session
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Voice logger integration coming soon.</p>
                    )}
                  </Card>
  );

  const card_integration = (
    <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Integration Framework</h2>
                  {content.integration ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Framework Overview</h3>
                        <p className="text-muted-foreground">{content.integration.framework}</p>
                      </div>
                      {content.integration.follow_up_structure && (
                        <div>
                          <h3 className="font-medium mb-2">Follow-up Structure</h3>
                          <ul className="space-y-2">
                            {content.integration.follow_up_structure.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium mb-2">Integration Prompts</h3>
                        <ul className="space-y-2">
                          {content.integration.prompts?.map((prompt: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              "{prompt}"
                            </li>
                          ))}
                        </ul>
                      </div>
                      {content.integration.homework && (
                        <div>
                          <h3 className="font-medium mb-2">Homework Assignments</h3>
                          <ul className="space-y-2">
                            {content.integration.homework.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <ClipboardList className="w-4 h-4 mt-0.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="pt-4 flex flex-wrap gap-3">
                        <Link to={localePath(locale, '/submit-symbol')}>
                          <Button className="gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Submit to the Registry
                          </Button>
                        </Link>
                        <Link to={`/log?protocol=${protocol.slug}`}>
                          <Button variant="outline" className="gap-2">
                            <Mic className="w-4 h-4" />
                            Start Voice Logger with These Prompts
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Integration framework coming soon.</p>
                  )}
                </Card>
  );

  const card_controls_and_rigor = (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Controls and Rigor</h2>
      {content.controls_and_rigor ? (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Why these controls</h3>
            <p className="text-muted-foreground">{content.controls_and_rigor.why}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Practices</h3>
            <ul className="space-y-2">
              {content.controls_and_rigor.practices?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <ClipboardList className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Controls and rigor documentation coming soon.</p>
      )}
    </Card>
  );

  const card_export = (
    <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Data Export & EHR Integration</h2>
                    {content.data_export ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Export Formats</h3>
                          <div className="flex flex-wrap gap-2">
                            {content.data_export.formats?.map((format: string, i: number) => (
                              <Badge key={i} variant="outline">{format}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Exportable Fields</h3>
                          <ul className="grid grid-cols-2 gap-2">
                            {content.data_export.fields?.map((field: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {field}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {content.data_export.fhir_ready && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <h3 className="font-medium mb-1 text-blue-600">FHIR-Ready</h3>
                            <p className="text-sm text-muted-foreground">
                              Export data is structured for future FHIR endpoint integration with major EHR systems.
                            </p>
                          </div>
                        )}
                        <div className="pt-4 flex gap-3">
                          <Button variant="outline" className="gap-2" disabled>
                            <Download className="w-4 h-4" />
                            Export Session Data (Coming Soon)
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Data export options coming soon.</p>
                    )}
                  </Card>
  );

  const card_safety = (
    <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Safety Profile & Monitoring</h2>
                  {content.safety ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Contraindications
                        </h3>
                        <ul className="space-y-2">
                          {content.safety.contraindications?.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-red-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Common Side Effects</h3>
                        <div className="flex flex-wrap gap-2">
                          {content.safety.side_effects?.map((effect: string, i: number) => (
                            <Badge key={i} variant="outline">{effect}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Monitoring Requirements</h3>
                        <p className="text-muted-foreground">{content.safety.monitoring}</p>
                      </div>
                      {content.safety.rems_requirements && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <h3 className="font-medium mb-1 text-amber-600">REMS Requirements (Spravato®)</h3>
                          <p className="text-sm text-muted-foreground">{content.safety.rems_requirements}</p>
                        </div>
                      )}
                      {content.safety.abort_criteria && (
                        <div>
                          <h3 className="font-medium mb-2 flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            When to Abort Session
                          </h3>
                          <ul className="space-y-2">
                            {content.safety.abort_criteria.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                                <AlertTriangle className="w-4 h-4 text-destructive" aria-hidden="true" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Safety information coming soon.</p>
                  )}
                </Card>
  );

  const card_research = (
    <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Research Citations</h2>
                  {content.citations && content.citations.length > 0 ? (
                    <ul className="space-y-4">
                      {content.citations.map((citation: any, i: number) => (
                        <li key={i} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0">
                          <div>
                            <p className="font-medium">{citation.title}</p>
                            <p className="text-sm text-muted-foreground">{citation.year}</p>
                          </div>
                          {citation.doi && (
                            <a 
                              href={citation.doi.startsWith('10.') ? `https://doi.org/${citation.doi}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <Button variant="outline" size="sm" className="gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {citation.doi.startsWith('10.') ? 'DOI' : 'Info'}
                              </Button>
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Research citations coming soon.</p>
                  )}
                </Card>
  );

  const card_related = (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Related protocols</h2>
      {content.related && content.related.length > 0 ? (
        <ul className="space-y-4">
          {content.related.map((related: any, i: number) => (
            <li key={i} className="pb-4 border-b last:border-0">
              <Link
                to={localePath(locale, `/protocols/${related.slug}`)}
                className="font-medium hover:underline"
              >
                {related.title}
              </Link>
              {related.why && (
                <p className="text-sm text-muted-foreground mt-1">{related.why}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Related protocols coming soon.</p>
      )}
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>{protocol.slug === 'dmt-laser' ? `${shown.title} - 650 nm DMT laser protocol | DMT Code` : `${shown.title} | DMT Code Protocols`}</title>
        <meta 
          name="description" 
          content={`${shown.tagline || shown.title} - Evidence-based protocol with preparation, dosing, and integration guidelines.`} 
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": shown.title,
            "description": shown.tagline,
            "lastReviewed": protocol.updated_at,
            "mainContentOfPage": {
              "@type": "WebPageElement",
              "cssSelector": "main"
            }
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-8">
            <Link 
              to="/protocols" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Protocols
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${status.color} text-white`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Badge variant="outline">{protocol.compound}</Badge>
                  {isClinicalMode && (
                    <Badge variant="outline" className="border-green-500/50 text-green-500">
                      <Stethoscope className="w-3 h-3 mr-1" />
                      Psychiatry-Grade
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                  {protocol.slug === 'dmt-laser' ? `${shown.title}: 650 nm DMT Laser Protocol` : shown.title}
                </h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                  {shown.tagline}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <FollowButton entityType="protocol" entityId={protocol.id} size="lg" />
                <Link to={`/log?protocol=${protocol.slug}`}>
                  <Button size="lg" className="gap-2">
                    <Mic className="w-5 h-5" />
                    {isClinicalMode ? 'Start Clinical Session Log' : 'Start Logging This Protocol'}
                  </Button>
                </Link>
              </div>

            </div>
          </section>

          {/* Protocol Content */}
          <section className="container mx-auto px-4 pb-16">
            {/* Desktop: tabbed layout */}
            <Tabs defaultValue="overview" className="w-full hidden md:block">
              <TabsList
                className="grid w-full mb-8"
                style={{
                  gridTemplateColumns: `repeat(${
                    5 + (showDosing ? 1 : 0) + (isClinicalMode ? 3 : 0) + (showControlsRigor ? 1 : 0)
                  }, minmax(0, 1fr))`,
                }}
              >
                <TabsTrigger value="overview" className="gap-1">
                  <BookOpen className="w-4 h-4 hidden md:block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="preparation" className="gap-1">
                  <Brain className="w-4 h-4 hidden md:block" />
                  Preparation
                </TabsTrigger>
                {showDosing && (
                  <TabsTrigger value="dosing" className="gap-1">
                    <Pill className="w-4 h-4 hidden md:block" />
                    Dosing
                  </TabsTrigger>
                )}
                {isClinicalMode && (
                  <TabsTrigger value="session" className="gap-1">
                    <Activity className="w-4 h-4 hidden md:block" />
                    Session
                  </TabsTrigger>
                )}
                {isClinicalMode && (
                  <TabsTrigger value="voice-logger" className="gap-1">
                    <Mic className="w-4 h-4 hidden md:block" />
                    Voice Log
                  </TabsTrigger>
                )}
                <TabsTrigger value="integration" className="gap-1">
                  <ClipboardList className="w-4 h-4 hidden md:block" />
                  Integration
                </TabsTrigger>
                {showControlsRigor && (
                  <TabsTrigger value="controls-and-rigor" className="gap-1">
                    <ClipboardList className="w-4 h-4 hidden md:block" />
                    Controls and Rigor
                  </TabsTrigger>
                )}
                {isClinicalMode && (
                  <TabsTrigger value="export" className="gap-1">
                    <Download className="w-4 h-4 hidden md:block" />
                    Export
                  </TabsTrigger>
                )}
                <TabsTrigger value="safety" className="gap-1">
                  <Shield className="w-4 h-4 hidden md:block" />
                  Safety
                </TabsTrigger>
                <TabsTrigger value="research" className="gap-1">
                  <FileText className="w-4 h-4 hidden md:block" />
                  Research
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">{card_overview}</TabsContent>

              {/* Preparation Tab */}
              <TabsContent value="preparation">{card_preparation}</TabsContent>

              {/* Dosing Tab: hidden entirely when there is no dosing content */}
              {showDosing && (
                <TabsContent value="dosing">{card_dosing}</TabsContent>
              )}

              {/* Session Execution Tab (Clinical Only) */}
              {isClinicalMode && (
                <TabsContent value="session">{card_session}</TabsContent>
              )}

              {/* Voice Logger Integration Tab (Clinical Only) */}
              {isClinicalMode && (
                <TabsContent value="voice-logger">{card_voice_logger}</TabsContent>
              )}

              {/* Integration Tab */}
              <TabsContent value="integration">{card_integration}</TabsContent>

              {/* Controls and Rigor Tab */}
              {showControlsRigor && (
                <TabsContent value="controls-and-rigor">{card_controls_and_rigor}</TabsContent>
              )}

              {/* Data Export Tab (Clinical Only) */}
              {isClinicalMode && (
                <TabsContent value="export">{card_export}</TabsContent>
              )}

              {/* Safety Tab */}
              <TabsContent value="safety">{card_safety}</TabsContent>

              {/* Research Tab */}
              <TabsContent value="research">{card_research}</TabsContent>
            </Tabs>

            {/* Mobile: every section stacked, each preceded by its heading */}
            <div className="md:hidden space-y-10">
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Overview
                </h2>
                {card_overview}
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" aria-hidden="true" />
                  Preparation
                </h2>
                {card_preparation}
              </div>

              {showDosing && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4" aria-hidden="true" />
                    Dosing
                  </h2>
                  {card_dosing}
                </div>
              )}

              {isClinicalMode && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" aria-hidden="true" />
                    Session
                  </h2>
                  {card_session}
                </div>
              )}

              {isClinicalMode && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Mic className="w-4 h-4" aria-hidden="true" />
                    Voice Log
                  </h2>
                  {card_voice_logger}
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" aria-hidden="true" />
                  Integration
                </h2>
                {card_integration}
              </div>

              {showControlsRigor && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" aria-hidden="true" />
                    Controls and Rigor
                  </h2>
                  {card_controls_and_rigor}
                </div>
              )}

              {isClinicalMode && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Export
                  </h2>
                  {card_export}
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" aria-hidden="true" />
                  Safety
                </h2>
                {card_safety}
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  Research
                </h2>
                {card_research}
              </div>
            </div>

            {content.related && content.related.length > 0 && (
              <div className="mt-10">
                {card_related}
              </div>
            )}
            <GolerAttribution className="mt-10 max-w-3xl" />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProtocolDetail;