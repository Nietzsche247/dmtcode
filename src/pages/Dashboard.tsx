import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { SymbolGrid } from '@/components/dashboard/SymbolGrid';
import { useDashboardTracking } from '@/hooks/useDashboardTracking';

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

interface Stats {
  totalSubmissions: number;
  validationsGiven: number;
  validationsReceived: number;
  reputationScore: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { trackDashboardViewed, trackTabSwitched } = useDashboardTracking();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mySubmissions, setMySubmissions] = useState<SymbolSubmission[]>([]);
  const [validatedSymbols, setValidatedSymbols] = useState<ValidatedSymbol[]>([]);
  const [savedSymbols, setSavedSymbols] = useState<SavedSymbol[]>([]);
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
        <title>Dashboard | DMT Code Visual Symbol Catalogue</title>
        <meta name="description" content="View your submitted symbols, validations, and saved symbols" />
        <link rel="canonical" href="https://dmtcode.com/dashboard" />
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
              <TabsList className="grid w-full grid-cols-3 max-w-lg mb-8">
                <TabsTrigger value="submissions">
                  My Submissions ({mySubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="validated">
                  Validated ({validatedSymbols.length})
                </TabsTrigger>
                <TabsTrigger value="saved">
                  Saved ({savedSymbols.length})
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
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;