import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Upload, CheckCircle2, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Leaderboard = () => {
  // Fetch profiles for reputation and symbol count leaderboard
  const { data: topProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['leaderboard-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, reputation_score, symbol_count')
        .order('reputation_score', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Validations tab retired: derived counts from user_stats were not aligned
  // with real seen_it votes, so we removed the tab rather than show wrong numbers.

  const { data: registryStats } = useQuery({
    queryKey: ['registry-stats'],
    queryFn: async () => {
      // Real convergence counts come from symbol_submissions and symbol_votes only.
      const { count: totalSymbols } = await supabase
        .from('symbol_submissions')
        .select('*', { count: 'exact', head: true });

      const { count: totalConfirmations } = await supabase
        .from('symbol_votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'seen_it');

      const { count: totalContributors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      return {
        totalSymbols: totalSymbols || 0,
        uniqueSymbols: totalConfirmations || 0,
        totalContributors: totalContributors || 0,
      };
    }
  });

  const isLoading = profilesLoading;

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
                  {registryStats?.totalContributors || 0}
                </div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </Card>
              <Card className="p-6 text-center border-primary/20">
                <div className="text-4xl font-bold text-gold mb-2">
                  {registryStats?.uniqueSymbols || 0}
                </div>
                <div className="text-sm text-muted-foreground">Confirmations</div>
              </Card>
            </div>

            {/* Leaderboard Tabs */}
            <Tabs defaultValue="reputation" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="reputation">
                  <Award className="w-4 h-4 mr-2" />
                  Reputation
                </TabsTrigger>
                <TabsTrigger value="symbols">
                  <Upload className="w-4 h-4 mr-2" />
                  Symbol Count
                </TabsTrigger>
              </TabsList>

              {/* Reputation Tab */}
              <TabsContent value="reputation" className="space-y-4">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </Card>
                ) : topProfiles && topProfiles.length > 0 ? (
                  topProfiles.map((profile, index) => (
                    <Card key={profile.id} className="p-6 border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                          {index === 0 && <Trophy className="w-6 h-6 text-gold" />}
                          {index === 1 && <Trophy className="w-6 h-6 text-muted-foreground" />}
                          {index === 2 && <Trophy className="w-6 h-6 text-amber-700" />}
                          {index > 2 && `#${index + 1}`}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile.display_name?.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{profile.display_name}</span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{profile.symbol_count || 0} symbols</span>
                            <span>{profile.reputation_score || 0} reputation</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gold flex items-center gap-1">
                            <Star className="w-5 h-5" />
                            {profile.reputation_score || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Reputation</div>
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

              {/* Symbol Count Tab */}
              <TabsContent value="symbols" className="space-y-4">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading leaderboard...</p>
                  </Card>
                ) : topProfiles && topProfiles.length > 0 ? (
                  [...topProfiles]
                    .sort((a, b) => (b.symbol_count || 0) - (a.symbol_count || 0))
                    .map((profile, index) => (
                      <Card key={profile.id} className="p-6 border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                            {index === 0 && <Trophy className="w-6 h-6 text-gold" />}
                            {index === 1 && <Trophy className="w-6 h-6 text-muted-foreground" />}
                            {index === 2 && <Trophy className="w-6 h-6 text-amber-700" />}
                            {index > 2 && `#${index + 1}`}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {profile.display_name?.slice(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{profile.display_name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {profile.reputation_score || 0} reputation
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gold flex items-center gap-1">
                              <Upload className="w-5 h-5" />
                              {profile.symbol_count || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Symbols</div>
                          </div>
                        </div>
                      </Card>
                    ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No symbols submitted yet.</p>
                  </Card>
                )}
              </TabsContent>

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
