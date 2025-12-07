import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { SymbolGrid } from '@/components/dashboard/SymbolGrid';
import { useDashboardTracking } from '@/hooks/useDashboardTracking';
import { useUgcTracking } from '@/hooks/useUgcTracking';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, TrendingUp, TrendingDown, Minus, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  reputation_score: number;
}

interface SymbolSubmission {
  id: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  upvotes: number;
  downvotes: number;
  description: string | null;
  tags: string[] | null;
  created_at: string;
}

interface ValidatedSymbol {
  id: string;
  image_url: string;
  description: string | null;
  tags: string[] | null;
  upvotes: number;
}

interface SavedSymbol {
  id: string;
  image_url: string;
  description: string | null;
  tags: string[] | null;
  upvotes: number;
}

interface AssessmentHistory {
  id: string;
  phq9_score: number | null;
  gad7_score: number | null;
  meq4_score: number | null;
  ceq7_score: number | null;
  mood_pre: number | null;
  mood_post: number | null;
  created_at: string;
}

interface Stats {
  totalSubmissions: number;
  validationsGiven: number;
  validationsReceived: number;
  reputationScore: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { trackDashboardViewed, trackTabSwitched } = useDashboardTracking();
  const { trackDashboardTabViewed } = useUgcTracking();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mySubmissions, setMySubmissions] = useState<SymbolSubmission[]>([]);
  const [validatedSymbols, setValidatedSymbols] = useState<ValidatedSymbol[]>([]);
  const [savedSymbols, setSavedSymbols] = useState<SavedSymbol[]>([]);
  const [assessments, setAssessments] = useState<AssessmentHistory[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSubmissions: 0,
    validationsGiven: 0,
    validationsReceived: 0,
    reputationScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  useEffect(() => {
    checkAuthAndLoad();
    trackDashboardViewed();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to view your dashboard');
      navigate('/auth');
      return;
    }

    await Promise.all([
      loadProfile(user.id),
      loadMySubmissions(user.id),
      loadValidatedSymbols(user.id),
      loadSavedSymbols(user.id),
      loadAssessments(user.id),
      loadStats(user.id),
    ]);
    
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, reputation_score')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const loadMySubmissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, status, upvotes, downvotes, description, tags, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMySubmissions(data as SymbolSubmission[]);
    }
  };

  const loadValidatedSymbols = async (userId: string) => {
    // Get symbols where user voted "seen_it"
    const { data: votes, error: votesError } = await supabase
      .from('symbol_votes')
      .select('symbol_id')
      .eq('user_id', userId)
      .eq('vote_type', 'seen_it');

    if (votesError || !votes || votes.length === 0) {
      setValidatedSymbols([]);
      return;
    }

    const symbolIds = votes.map(v => v.symbol_id);
    const { data: symbols } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, description, tags, upvotes')
      .in('id', symbolIds);

    if (symbols) {
      setValidatedSymbols(symbols);
    }
  };

  const loadSavedSymbols = async (userId: string) => {
    const { data: saved, error: savedError } = await supabase
      .from('saved_symbols')
      .select('symbol_id')
      .eq('user_id', userId);

    if (savedError || !saved || saved.length === 0) {
      setSavedSymbols([]);
      return;
    }

    const symbolIds = saved.map(s => s.symbol_id);
    const { data: symbols } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, description, tags, upvotes')
      .in('id', symbolIds);

    if (symbols) {
      setSavedSymbols(symbols);
    }
  };

  const loadAssessments = async (userId: string) => {
    const { data, error } = await supabase
      .from('assessments')
      .select('id, phq9_score, gad7_score, meq4_score, ceq7_score, mood_pre, mood_post, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssessments(data);
    }
  };

  const loadStats = async (userId: string) => {
    // Get submission count and received votes
    const { data: submissions } = await supabase
      .from('symbol_submissions')
      .select('id, upvotes, downvotes')
      .eq('user_id', userId);

    const totalSubmissions = submissions?.length || 0;
    const validationsReceived = submissions?.reduce((sum, s) => sum + s.upvotes, 0) || 0;

    // Get validations given (seen_it votes)
    const { count: validationsGiven } = await supabase
      .from('symbol_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('vote_type', 'seen_it');

    // Get reputation from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('reputation_score')
      .eq('id', userId)
      .maybeSingle();

    setStats({
      totalSubmissions,
      validationsGiven: validationsGiven || 0,
      validationsReceived,
      reputationScore: profileData?.reputation_score || 0,
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackTabSwitched(tab);
    trackDashboardTabViewed(tab);
  };

  const handleNameUpdate = (newName: string) => {
    if (profile) {
      setProfile({ ...profile, display_name: newName });
    }
  };

  const handleRemoveSaved = async (symbolId: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('saved_symbols')
      .delete()
      .eq('user_id', profile.id)
      .eq('symbol_id', symbolId);

    if (!error) {
      setSavedSymbols(prev => prev.filter(s => s.id !== symbolId));
      toast.success('Symbol removed from saved');
    }
  };

  if (loading || !profile) {
    return (
      <div className="relative min-h-screen bg-background">
        <Navigation />
        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            Loading your dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Dashboard | DMT Code</title>
        <meta name="description" content="View your submitted symbols, validations, saved symbols, and assessment history in your personal DMT Code dashboard." />
        <link rel="canonical" href="https://dmtcode.com/dashboard" />
        <meta name="robots" content="noindex, nofollow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
              { "@type": "ListItem", "position": 2, "name": "My Dashboard", "item": "https://dmtcode.com/dashboard" }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4">
            <ProfileHeader
              userId={profile.id}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              reputationScore={stats.reputationScore}
              onNameUpdate={handleNameUpdate}
            />

            <StatsSection
              totalSubmissions={stats.totalSubmissions}
              validationsGiven={stats.validationsGiven}
              validationsReceived={stats.validationsReceived}
              reputationScore={stats.reputationScore}
            />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-8">
                <TabsTrigger value="submissions">
                  Submissions ({mySubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="validated">
                  Validated ({validatedSymbols.length})
                </TabsTrigger>
                <TabsTrigger value="saved">
                  Saved ({savedSymbols.length})
                </TabsTrigger>
                <TabsTrigger value="assessments">
                  Assessments ({assessments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submissions">
                <SymbolGrid
                  symbols={mySubmissions}
                  showStatus
                  emptyMessage="You haven't submitted any symbols yet."
                  emptyAction={{
                    label: 'Submit your first symbol',
                    href: '/submit-symbol',
                  }}
                />
              </TabsContent>

              <TabsContent value="validated">
                <SymbolGrid
                  symbols={validatedSymbols}
                  emptyMessage="You haven't validated any symbols yet."
                  emptyAction={{
                    label: 'Browse the registry',
                    href: '/registry',
                  }}
                />
              </TabsContent>

              <TabsContent value="saved">
                <SymbolGrid
                  symbols={savedSymbols}
                  showRemove
                  onRemove={handleRemoveSaved}
                  emptyMessage="You haven't saved any symbols yet."
                  emptyAction={{
                    label: 'Browse the registry to save symbols',
                    href: '/registry',
                  }}
                />
              </TabsContent>

              <TabsContent value="assessments">
                {assessments.length === 0 ? (
                  <Card className="border-dashed border-2 border-muted">
                    <CardContent className="p-8 text-center">
                      <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">You haven't completed any assessments yet.</p>
                      <Button asChild>
                        <Link to="/assess">Take Your First Assessment</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessments.map((assessment) => {
                      const moodDelta = assessment.mood_post !== null && assessment.mood_pre !== null 
                        ? assessment.mood_post - assessment.mood_pre 
                        : null;
                      const MoodIcon = moodDelta !== null && moodDelta > 0 ? TrendingUp : moodDelta !== null && moodDelta < 0 ? TrendingDown : Minus;
                      const moodColor = moodDelta !== null && moodDelta > 0 ? 'text-green-500' : moodDelta !== null && moodDelta < 0 ? 'text-red-500' : 'text-muted-foreground';
                      
                      return (
                        <Card key={assessment.id} className="hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(assessment.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <div className={`flex items-center gap-1 text-sm ${moodColor}`}>
                                <MoodIcon className="h-4 w-4" />
                                {moodDelta !== null ? (moodDelta > 0 ? `+${moodDelta}` : moodDelta) : '—'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="text-center p-2 rounded bg-muted/50">
                                <div className="text-lg font-bold">{assessment.phq9_score ?? '—'}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">PHQ-9</div>
                              </div>
                              <div className="text-center p-2 rounded bg-muted/50">
                                <div className="text-lg font-bold">{assessment.gad7_score ?? '—'}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">GAD-7</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {assessment.meq4_score !== null && <Badge variant="outline" className="text-[10px]">MEQ-4: {assessment.meq4_score}</Badge>}
                                {assessment.ceq7_score !== null && <Badge variant="outline" className="text-[10px]">CEQ-7: {assessment.ceq7_score}</Badge>}
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/assess?view=${assessment.id}`}>
                                  <Download className="h-3 w-3 mr-1" />
                                  PDF
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;