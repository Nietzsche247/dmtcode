import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Award, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface UserStats {
  total_submissions: number;
  total_validations: number;
  total_tags_added: number;
  rank: number;
  badges_earned: string[];
}

interface UserBadge {
  badge_name: string;
  earned_at: string;
  icon?: string;
  description?: string;
}

interface UserSymbol {
  id: string;
  image_data: string;
  confirmation_count: number;
  motif_tags: string[];
  created_at: string;
  orcid?: string;
}

const MySymbols = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userSymbols, setUserSymbols] = useState<UserSymbol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    setUserId(user.id);
    await Promise.all([
      loadUserStats(user.id),
      loadUserBadges(user.id),
      loadUserSymbols(user.id)
    ]);
    setLoading(false);
  };

  const loadUserStats = async (uid: string) => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', uid)
      .single();
    
    if (data) {
      setUserStats(data);
    }
  };

  const loadUserBadges = async (uid: string) => {
    const { data } = await supabase
      .from('user_badges')
      .select('badge_name, earned_at')
      .eq('user_id', uid)
      .order('earned_at', { ascending: false });
    
    if (data) {
      // Get badge details
      const { data: badgeDetails } = await supabase
        .from('badges')
        .select('name, icon, description')
        .in('name', data.map(b => b.badge_name));
      
      const enrichedBadges = data.map(badge => {
        const details = badgeDetails?.find(b => b.name === badge.badge_name);
        return {
          ...badge,
          icon: details?.icon,
          description: details?.description
        };
      });
      
      setUserBadges(enrichedBadges);
    }
  };

  const loadUserSymbols = async (uid: string) => {
    const { data } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, confirmation_count, motif_tags, created_at, orcid')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    
    if (data) {
      setUserSymbols(data);
    }
  };

  const downloadData = () => {
    const data = {
      stats: userStats,
      badges: userBadges,
      symbols: userSymbols
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmtcode-my-data-${Date.now()}.json`;
    a.click();
    toast.success('Downloaded your data');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your symbols...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Symbols | DMT Code Visual Symbol Catalogue</title>
        <meta name="description" content="Your personal symbol submissions, badges, and statistics" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <div className="block md:hidden">
            <Breadcrumb />
          </div>

          <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">My Symbols</h1>

            {/* User Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card className="p-6 bg-card border-border text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userStats?.total_submissions || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </Card>

              <Card className="p-6 bg-card border-border text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userStats?.total_validations || 0}
                </div>
                <div className="text-sm text-muted-foreground">Validations</div>
              </Card>

              <Card className="p-6 bg-card border-border text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userBadges.length}
                </div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </Card>

              <Card className="p-6 bg-card border-border text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userStats?.rank || '—'}
                </div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </Card>
            </div>

            {/* Badges Section */}
            {userBadges.length > 0 && (
              <Card className="p-8 mb-12 bg-card border-border">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6" /> Your Badges
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userBadges.map(badge => (
                    <div key={badge.badge_name} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                      <div className="font-semibold text-sm mb-1">
                        {badge.badge_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      {badge.description && (
                        <div className="text-xs text-muted-foreground">{badge.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Next Milestone */}
            {userStats && (
              <Card className="p-6 mb-12 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Next Milestone</h3>
                      <p className="text-sm text-muted-foreground">
                        {userStats.total_submissions < 5 && `Submit ${5 - userStats.total_submissions} more for Contributor badge`}
                        {userStats.total_submissions >= 5 && userStats.total_submissions < 10 && `Submit ${10 - userStats.total_submissions} more for Researcher badge`}
                        {userStats.total_submissions >= 10 && userStats.total_submissions < 25 && `Submit ${25 - userStats.total_submissions} more for Data Scientist badge`}
                        {userStats.total_submissions >= 25 && userStats.total_submissions < 50 && `Submit ${50 - userStats.total_submissions} more for Archive Builder badge`}
                        {userStats.total_submissions >= 50 && userStats.total_submissions < 100 && `Submit ${100 - userStats.total_submissions} more for Pattern Master badge`}
                        {userStats.total_submissions >= 100 && 'You\'ve reached the highest milestone!'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={downloadData} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data
                  </Button>
                </div>
              </Card>
            )}

            {/* Symbols Grid */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-6">
                My Submitted Symbols ({userSymbols.length})
              </h2>
            </div>

            {userSymbols.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">You haven't submitted any symbols yet</p>
                <Button onClick={() => window.location.href = '/registry#submit'}>
                  Submit Your First Symbol
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userSymbols.map(symbol => (
                  <Card key={symbol.id} className="p-4 bg-card border-border">
                    <img 
                      src={symbol.image_data} 
                      alt={`Your symbol - ${symbol.motif_tags?.slice(0, 2).join(', ') || 'visual symbol'}`}
                      className="w-full h-auto mb-3 border border-border"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="text-center mb-3">
                      <p className="text-sm font-semibold">
                        {symbol.confirmation_count} {symbol.confirmation_count === 1 ? 'Report' : 'Reports'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(symbol.created_at).toLocaleDateString()}
                      </p>
                      {symbol.orcid && (
                        <a 
                          href={`https://orcid.org/${symbol.orcid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          <img 
                            src="https://orcid.org/assets/vectors/orcid.logo.icon.svg" 
                            alt="ORCID" 
                            className="w-3 h-3"
                          />
                          {symbol.orcid}
                        </a>
                      )}
                    </div>
                    {symbol.motif_tags && symbol.motif_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {symbol.motif_tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MySymbols;