import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlaskConical, Stethoscope, Clock, ArrowRight, Mic } from 'lucide-react';

const statusConfig = {
  clinical: { label: 'Clinical', color: 'bg-green-500', icon: Stethoscope },
  research: { label: 'Research', color: 'bg-blue-500', icon: FlaskConical },
  coming_soon: { label: 'Coming Soon', color: 'bg-muted', icon: Clock },
};

const Protocols = () => {
  const { data: protocols, isLoading } = useQuery({
    queryKey: ['protocols'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .eq('is_published', true)
        .order('status', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <>
      <Helmet>
        <title>Therapy Protocols | Consciousness Research Hub | DMT Code</title>
        <meta 
          name="description" 
          content="Evidence-based therapeutic protocols for ketamine, psilocybin, MDMA, and psychedelic-assisted therapy. Preparation, dosing, integration frameworks." 
        />
        <link rel="canonical" href="https://dmtcode.com/protocols" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Therapeutic Protocols",
            "description": "Evidence-based protocols for psychedelic-assisted therapy",
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": protocols?.length || 0,
              "itemListElement": protocols?.map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `https://dmtcode.com/protocols/${p.slug}`
              }))
            }
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <FlaskConical className="w-3 h-3 mr-1" />
              CONSCIOUSNESS RESEARCH
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              THERAPY
              <span className="block text-primary">PROTOCOLS</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Evidence-based frameworks for psychedelic-assisted therapy. Each protocol includes 
              preparation guidelines, dosing schedules, integration frameworks, and voice logging integration.
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/log">
                <Button className="gap-2">
                  <Mic className="w-4 h-4" />
                  Start Voice Logger
                </Button>
              </Link>
            </div>
          </section>

          {/* Protocols Grid */}
          <section className="container mx-auto px-4 pb-16">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-32 bg-muted rounded mb-4"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocols?.map((protocol) => {
                  const status = statusConfig[protocol.status as keyof typeof statusConfig] || statusConfig.coming_soon;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Link 
                      key={protocol.id} 
                      to={`/protocols/${protocol.slug}`}
                      className="group"
                    >
                      <Card className="p-6 h-full border-border hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                        {/* Hero Image Placeholder */}
                        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          <FlaskConical className="w-12 h-12 text-primary/40" />
                          <Badge 
                            className={`absolute top-2 right-2 ${status.color} text-white`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {protocol.title}
                            </h3>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            {protocol.compound}
                          </Badge>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {protocol.tagline || 'Protocol documentation coming soon.'}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 pb-16">
            <Card className="p-8 bg-primary/5 border-primary/20 text-center">
              <h2 className="text-2xl font-semibold mb-4">Contribute Protocol Documentation</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Are you a researcher or clinician with protocol expertise? Help expand our 
                evidence-based documentation for the community.
              </p>
              <Link to="/about">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Protocols;