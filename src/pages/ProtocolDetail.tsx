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
import { 
  FlaskConical, Stethoscope, Clock, ArrowLeft, Mic, 
  BookOpen, Shield, Pill, Brain, FileText, ExternalLink,
  AlertTriangle, CheckCircle2
} from 'lucide-react';

const statusConfig = {
  clinical: { label: 'Clinical', color: 'bg-green-500', icon: Stethoscope },
  research: { label: 'Research', color: 'bg-blue-500', icon: FlaskConical },
  coming_soon: { label: 'Coming Soon', color: 'bg-muted', icon: Clock },
};

const ProtocolDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

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

  const content = protocol.content_jsonb as any || {};
  const status = statusConfig[protocol.status as keyof typeof statusConfig] || statusConfig.coming_soon;
  const StatusIcon = status.icon;

  return (
    <>
      <Helmet>
        <title>{protocol.title} | DMT Code Protocols</title>
        <meta 
          name="description" 
          content={`${protocol.tagline || protocol.title} - Evidence-based protocol with preparation, dosing, and integration guidelines.`} 
        />
        <link rel="canonical" href={`https://dmtcode.com/protocols/${protocol.slug}`} />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": protocol.title,
            "description": protocol.tagline,
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
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                  {protocol.title}
                </h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                  {protocol.tagline}
                </p>
              </div>

              <Link to={`/log?protocol=${protocol.slug}`}>
                <Button size="lg" className="gap-2">
                  <Mic className="w-5 h-5" />
                  Start Logging This Protocol
                </Button>
              </Link>
            </div>
          </section>

          {/* Protocol Content */}
          <section className="container mx-auto px-4 pb-16">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8">
                <TabsTrigger value="overview" className="gap-1">
                  <BookOpen className="w-4 h-4 hidden md:block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="preparation" className="gap-1">
                  <Brain className="w-4 h-4 hidden md:block" />
                  Preparation
                </TabsTrigger>
                <TabsTrigger value="dosing" className="gap-1">
                  <Pill className="w-4 h-4 hidden md:block" />
                  Dosing
                </TabsTrigger>
                <TabsTrigger value="integration" className="gap-1">
                  <Mic className="w-4 h-4 hidden md:block" />
                  Integration
                </TabsTrigger>
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
              <TabsContent value="overview">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Overview</h2>
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
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Overview documentation coming soon.</p>
                  )}
                </Card>
              </TabsContent>

              {/* Preparation Tab */}
              <TabsContent value="preparation">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Preparation</h2>
                  {content.preparation ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Set & Setting</h3>
                        <p className="text-muted-foreground">{content.preparation.set_setting}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Screening Requirements</h3>
                        <ul className="space-y-2">
                          {content.preparation.screening?.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Preparation guidelines coming soon.</p>
                  )}
                </Card>
              </TabsContent>

              {/* Dosing Tab */}
              <TabsContent value="dosing">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Dosing Schedule</h2>
                  {content.dosing && content.dosing.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Route</th>
                            <th className="text-left py-3 px-4 font-medium">Dose</th>
                            <th className="text-left py-3 px-4 font-medium">Duration</th>
                            <th className="text-left py-3 px-4 font-medium">Sessions</th>
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
              </TabsContent>

              {/* Integration Tab */}
              <TabsContent value="integration">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Integration Framework</h2>
                  {content.integration ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Framework</h3>
                        <p className="text-muted-foreground">{content.integration.framework}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Voice Logger Prompts</h3>
                        <ul className="space-y-2">
                          {content.integration.prompts?.map((prompt: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              "{prompt}"
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4">
                        <Link to={`/log?protocol=${protocol.slug}`}>
                          <Button className="gap-2">
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
              </TabsContent>

              {/* Safety Tab */}
              <TabsContent value="safety">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Safety Profile</h2>
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
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Safety information coming soon.</p>
                  )}
                </Card>
              </TabsContent>

              {/* Research Tab */}
              <TabsContent value="research">
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
                              href={`https://doi.org/${citation.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <Button variant="outline" size="sm" className="gap-1">
                                <ExternalLink className="w-3 h-3" />
                                DOI
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
              </TabsContent>
            </Tabs>
          </section>

          {/* Protocol Anchor Packs - Hidden until ready */}
          {/* 
          <section className="container mx-auto px-4 pb-16">
            <Card className="p-8 border-primary/20">
              <h2 className="text-xl font-semibold mb-4">Protocol Anchor Packs</h2>
              <p className="text-muted-foreground">Curated equipment bundles for this protocol.</p>
            </Card>
          </section>
          */}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProtocolDetail;