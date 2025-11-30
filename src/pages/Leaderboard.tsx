import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Upload, Tag, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Leaderboard = () => {
  const { data: topContributors, isLoading } = useQuery({
    queryKey: ['leaderboard-contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*, user_id')
        .order('total_submissions', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: registryStats } = useQuery({
    queryKey: ['registry-stats'],
    queryFn: async () => {
      const { count: totalSymbols } = await supabase
        .from('registry_glyphs')
        .select('*', { count: 'exact', head: true });
      
      const { count: uniqueSymbols } = await supabase
        .from('registry_glyphs')
        .select('*', { count: 'exact', head: true })
        .eq('is_unique', true);
      
      return { totalSymbols: totalSymbols || 0, uniqueSymbols: uniqueSymbols || 0 };
    }
  });

  return (
    <>
      <Helmet>
        <title>Community Leaderboard | DMT Code</title>
        <meta 
          name="description" 
          content="Top contributors to the DMT Code Visual Symbol Registry. Rankings based on symbol submissions, validations, and community engagement." 
        />
        <link rel="canonical" href="https://dmtcode.com/leaderboard" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "headline": "Community Leaderboard",
            "description": "Top contributors to DMT Code Visual Symbol Registry by submissions and validations",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-30",
            "dateModified": "2025-11-30"
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://dmtcode.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Leaderboard",
                "item": "https://dmtcode.com/leaderboard"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          <section className="container mx-auto px-4 py-16 max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Leaderboard</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Top contributors building the open research catalogue through symbol submissions and community validation
              </p>
            </div>

            {/* Registry Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center border-primary/20">
                <div className="text-4xl font-bold text-gold mb-2">
                  {registryStats?.totalSymbols || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </Card>
              <Card className="p-6 text-center border-primary/20">
                <div className="text-4xl font-bold text-gold mb-2">
                  {registryStats?.uniqueSymbols || 0}
                </div>
                <div className="text-sm text-muted-foreground">Unique Symbols</div>
              </Card>
              <Card className="p-6 text-center border-primary/20">
                <div className="text-4xl font-bold text-gold mb-2">
                  {topContributors?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Contributors</div>
              </Card>
            </div>

            {/* Leaderboard Tabs */}
            <Tabs defaultValue="submissions" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="submissions">
                  <Upload className="w-4 h-4 mr-2" />
                  Submissions
                </TabsTrigger>
                <TabsTrigger value="validations">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Validations
                </TabsTrigger>
                <TabsTrigger value="tags">
                  <Tag className="w-4 h-4 mr-2" />
                  Tags Added
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submissions" className="space-y-4">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </Card>
                ) : topContributors && topContributors.length > 0 ? (
                  topContributors.map((contributor, index) => (
                    <Card key={contributor.id} className="p-6 border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                          {index === 0 && <Trophy className="w-6 h-6 text-gold" />}
                          {index === 1 && <Trophy className="w-6 h-6 text-muted-foreground" />}
                          {index === 2 && <Trophy className="w-6 h-6 text-amber-700" />}
                          {index > 2 && `#${index + 1}`}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Contributor #{contributor.session_id.slice(0, 8)}</span>
                            {contributor.badges_earned && contributor.badges_earned.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                {contributor.badges_earned.length} badges
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{contributor.total_submissions || 0} submissions</span>
                            <span>{contributor.total_validations || 0} validations</span>
                            <span>{contributor.total_tags_added || 0} tags</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gold">
                            {contributor.rank || index + 1}
                          </div>
                          <div className="text-xs text-muted-foreground">Rank</div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No contributors yet. Be the first to submit a symbol!</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="validations" className="space-y-4">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </Card>
                ) : topContributors && topContributors.length > 0 ? (
                  [...topContributors]
                    .sort((a, b) => (b.total_validations || 0) - (a.total_validations || 0))
                    .map((contributor, index) => (
                      <Card key={contributor.id} className="p-6 border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Contributor #{contributor.session_id.slice(0, 8)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {contributor.total_validations || 0} validations · {contributor.total_submissions || 0} submissions
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gold">
                            {contributor.total_validations || 0}
                          </div>
                        </div>
                      </Card>
                    ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No validations yet.</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tags" className="space-y-4">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </Card>
                ) : topContributors && topContributors.length > 0 ? (
                  [...topContributors]
                    .sort((a, b) => (b.total_tags_added || 0) - (a.total_tags_added || 0))
                    .map((contributor, index) => (
                      <Card key={contributor.id} className="p-6 border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Contributor #{contributor.session_id.slice(0, 8)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {contributor.total_tags_added || 0} tags · {contributor.total_submissions || 0} submissions
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gold">
                            {contributor.total_tags_added || 0}
                          </div>
                        </div>
                      </Card>
                    ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No tags added yet.</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Call to Action */}
            <Card className="p-8 bg-primary/5 border-primary/20 mt-12 text-center">
              <h2 className="text-2xl font-semibold mb-4">Join the Research Community</h2>
              <p className="text-base text-muted-foreground mb-6">
                Contribute to the open catalogue by submitting your observed symbols and validating community submissions
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a 
                  href="/registry" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Submit Symbol
                </a>
                <a 
                  href="/my-symbols" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                >
                  View My Dashboard
                </a>
              </div>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Leaderboard;
