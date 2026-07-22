import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { cn } from '@/lib/utils';

interface UserSymbol {
  id: string;
  image_url: string;
  upvotes: number;
  downvotes: number;
  tags: string[] | null;
  description: string | null;
  created_at: string;
  status?: string | null;
}

interface UserStats {
  totalSubmissions: number;
  totalValidations: number;
  totalSaved: number;
}

interface ConfirmationGiven {
  id: string;
  image_url: string;
  tags: string[] | null;
}

interface VoiceLog {
  id: string;
  created_at: string;
  duration_seconds: number | null;
  transcript: string | null;
  symbol_id: string | null;
}

interface ProfileRecord {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  avatar_seed: string;
  created_at: string;
  reputation_score: number;
}

interface BadgeRow {
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  threshold: number | null;
}

interface EarnedBadge {
  badge_name: string;
  earned_at: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatMonthYear = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const humanizeBadge = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

/** A single stat cell. When value is 0, renders a neutral dash + next-move link. */
const StatCell = ({
  label,
  value,
  nextMove,
}: {
  label: string;
  value: number;
  nextMove: { to: string; text: string };
}) => {
  const isZero = value === 0;
  return (
    <Card className="p-6 bg-card/50 border-border">
      <div className="text-center">
        <div
          className={cn(
            'text-3xl mb-1 tabular-nums',
            isZero ? 'text-muted-foreground/60 font-light' : 'text-primary font-bold'
          )}
          aria-label={isZero ? `${label}: none yet` : `${label}: ${value}`}
        >
          {isZero ? '—' : value}
        </div>
        <div className="text-sm text-muted-foreground mb-2">{label}</div>
        {isZero && (
          <Link to={nextMove.to} className="text-xs text-primary/80 underline underline-offset-2 hover:text-primary">
            {nextMove.text}
          </Link>
        )}
      </div>
    </Card>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [mySymbols, setMySymbols] = useState<UserSymbol[]>([]);
  const [savedSymbols, setSavedSymbols] = useState<UserSymbol[]>([]);
  const [confirmationsGiven, setConfirmationsGiven] = useState<ConfirmationGiven[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalSubmissions: 0, totalValidations: 0, totalSaved: 0 });
  const [allBadges, setAllBadges] = useState<BadgeRow[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [canon, setCanon] = useState<{ symbols: number; confirmations: number }>({ symbols: 0, confirmations: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadBadgeCatalog();
    loadCanon();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to view your profile');
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    loadProfile(user.id);
    loadMySymbols(user.id);
    loadSavedSymbols(user.id);
    loadConfirmationsGiven(user.id);
    loadVoiceLogs(user.id);
    loadStats(user.id);
    loadEarnedBadges(user.id);
  };

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url, avatar_seed, created_at, reputation_score')
      .eq('id', uid)
      .maybeSingle();
    if (data) setProfile(data as ProfileRecord);
  };

  const loadBadgeCatalog = async () => {
    const { data } = await supabase
      .from('badges')
      .select('name, description, icon, category, threshold')
      .order('threshold', { ascending: true, nullsFirst: true });
    if (data) setAllBadges(data as BadgeRow[]);
  };

  const loadEarnedBadges = async (uid: string) => {
    const { data } = await supabase
      .from('user_badges')
      .select('badge_name, earned_at')
      .eq('user_id', uid);
    if (data) setEarnedBadges(data as EarnedBadge[]);
  };

  const loadCanon = async () => {
    const [{ count: symbols }, { count: confirmations }] = await Promise.all([
      supabase
        .from('symbol_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('symbol_votes')
        .select('*', { count: 'exact', head: true })
        .eq('vote_type', 'seen_it'),
    ]);
    setCanon({ symbols: symbols || 0, confirmations: confirmations || 0 });
  };

  const loadConfirmationsGiven = async (uid: string) => {
    const { data: votes } = await supabase
      .from('symbol_votes')
      .select('symbol_id')
      .eq('user_id', uid)
      .eq('vote_type', 'seen_it');

    if (!votes || votes.length === 0) {
      setConfirmationsGiven([]);
      return;
    }
    const ids = votes.map(v => v.symbol_id);
    const { data: symbols } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, tags')
      .in('id', ids);
    if (symbols) setConfirmationsGiven(symbols as ConfirmationGiven[]);
  };

  const loadVoiceLogs = async (uid: string) => {
    const { data } = await supabase
      .from('voice_logs')
      .select('id, created_at, duration_seconds, transcript, symbol_id')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setVoiceLogs(data as VoiceLog[]);
  };

  const loadMySymbols = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, upvotes, downvotes, tags, description, created_at, status')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMySymbols(data as UserSymbol[]);
    }
    setLoading(false);
  };

  const loadSavedSymbols = async (uid: string) => {
    const { data: saved } = await supabase
      .from('saved_symbols')
      .select('symbol_id')
      .eq('user_id', uid);

    if (saved && saved.length > 0) {
      const ids = saved.map(s => s.symbol_id);
      const { data: symbols } = await supabase
        .from('symbol_submissions')
        .select('id, image_url, upvotes, downvotes, tags, description, created_at, status')
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (symbols) setSavedSymbols(symbols as UserSymbol[]);
    } else {
      setSavedSymbols([]);
    }
  };

  const loadStats = async (uid: string) => {
    const { data: mine } = await supabase
      .from('symbol_submissions')
      .select('id, upvotes')
      .eq('user_id', uid);

    const totalValidations = mine?.reduce((sum, g) => sum + (g.upvotes || 0), 0) || 0;

    const { count: savedCount } = await supabase
      .from('saved_symbols')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    setStats({
      totalSubmissions: mine?.length || 0,
      totalValidations,
      totalSaved: savedCount || 0,
    });
  };

  const unsave = async (symbolId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('saved_symbols')
      .delete()
      .eq('symbol_id', symbolId)
      .eq('user_id', userId);

    if (!error) {
      toast.success('Symbol removed from saved');
      loadSavedSymbols(userId);
    }
  };

  const earnedNames = new Set(earnedBadges.map(b => b.badge_name));

  return (
    <>
      <Helmet>
        <title>My Profile | DMT Code Visual Symbol Catalogue</title>
        <meta name="description" content="View your submitted symbols and saved community submissions" />
        <link rel="canonical" href="https://dmtcode.com/profile" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />

        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4">

            {/* Identity header */}
            <section className="mb-8 p-5 sm:p-6 bg-card/50 border border-border rounded-lg">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                {profile ? (
                  <AvatarGlyph
                    seed={profile.avatar_seed}
                    handle={profile.handle}
                    size={88}
                    className="shrink-0"
                  />
                ) : (
                  <div className="w-[88px] h-[88px] rounded-md border border-border bg-muted/40 animate-pulse shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-serif tracking-tight break-words">
                    {profile?.handle || profile?.display_name || 'Explorer'}
                  </h1>
                  {profile?.created_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Explorer since {formatMonthYear(profile.created_at)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground/90 mt-3 max-w-xl leading-relaxed">
                    Your identity stays private. We map the truth together, one recognition at a time.
                  </p>
                </div>
              </div>
            </section>

            {/* Canon endowment */}
            <p className="text-sm text-muted-foreground mb-4">
              The canon holds{' '}
              <span className="text-foreground font-medium tabular-nums">{canon.symbols}</span>{' '}
              symbol{canon.symbols === 1 ? '' : 's'} and{' '}
              <span className="text-foreground font-medium tabular-nums">{canon.confirmations}</span>{' '}
              confirmation{canon.confirmations === 1 ? '' : 's'} so far.{' '}
              <Link to="/registry" className="text-primary underline underline-offset-2">Add yours.</Link>
            </p>

            {/* Stat cells with dashed zeros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <StatCell
                label="Symbols Submitted"
                value={stats.totalSubmissions}
                nextMove={{ to: '/submit-symbol', text: 'Record what you saw' }}
              />
              <StatCell
                label="Validations Received"
                value={stats.totalValidations}
                nextMove={{ to: '/registry', text: 'Share a symbol to invite recognition' }}
              />
              <StatCell
                label="Symbols Saved"
                value={stats.totalSaved}
                nextMove={{ to: '/registry', text: 'Browse the registry' }}
              />
            </div>

            {/* Badges section */}
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-serif tracking-tight">Badges</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {earnedNames.size} of {allBadges.length} earned
                </span>
              </div>
              {allBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading badges…</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allBadges.map((b) => {
                    const earned = earnedNames.has(b.name);
                    return (
                      <div
                        key={b.name}
                        className={cn(
                          'p-4 rounded-lg border transition-all duration-300',
                          earned
                            ? 'bg-primary/5 border-primary/40'
                            : 'bg-card/30 border-border/60 opacity-70'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'text-2xl',
                              earned ? '' : 'grayscale opacity-60'
                            )}
                            aria-hidden="true"
                          >
                            {b.icon || (earned ? '✶' : '·')}
                          </span>
                          {!earned && (
                            <Lock className="w-3 h-3 text-muted-foreground" aria-label="Locked" />
                          )}
                        </div>
                        <div className="text-sm font-medium leading-tight">
                          {humanizeBadge(b.name)}
                        </div>
                        {b.description && (
                          <div className="text-xs text-muted-foreground mt-1 leading-snug">
                            {b.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Tabs defaultValue="my-symbols" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl">
                <TabsTrigger value="my-symbols">My Symbols ({mySymbols.length})</TabsTrigger>
                <TabsTrigger value="confirmations">Confirmations ({confirmationsGiven.length})</TabsTrigger>
                <TabsTrigger value="voice">Voice Logs ({voiceLogs.length})</TabsTrigger>
                <TabsTrigger value="saved">Saved ({savedSymbols.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="my-symbols" className="mt-8">
                {loading ? (
                  <div className="text-center text-muted-foreground">Loading your symbols...</div>
                ) : mySymbols.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    You haven't submitted any symbols yet.{' '}
                    <a href="/submit-symbol" className="text-primary underline">Submit your first symbol</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mySymbols.map((symbol) => (
                      <Card key={symbol.id} className="p-6 bg-card border-border">
                        <div className="flex justify-center mb-4">
                          <img
                            src={symbol.image_url}
                            alt={`Your symbol - ${symbol.tags?.slice(0, 3).join(', ') || 'visual symbol'}`}
                            className="w-[200px] h-[200px] border border-border object-contain bg-white"
                            loading="lazy"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Confirmed by <span className="font-semibold">{symbol.upvotes}</span> viewer{symbol.upvotes !== 1 ? 's' : ''}
                          </p>
                          {symbol.tags && symbol.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center">
                              {symbol.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="confirmations" className="mt-8">
                {confirmationsGiven.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    You haven't confirmed any symbols yet.{' '}
                    <a href="/registry" className="text-primary underline">Browse the registry</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {confirmationsGiven.map((s) => (
                      <a key={s.id} href={`/registry/${s.id}`} className="block">
                        <img
                          src={s.image_url}
                          alt={s.tags?.slice(0, 3).join(', ') || 'confirmed symbol'}
                          className="w-full aspect-square border border-border object-contain bg-white hover:border-primary transition-colors"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="voice" className="mt-8">
                {voiceLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    You haven't recorded any voice logs yet.{' '}
                    <a href="/log" className="text-primary underline">Start a voice log</a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {voiceLogs.map((log) => (
                      <Card key={log.id} className="p-4 bg-card border-border">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">
                              {new Date(log.created_at).toLocaleString()}
                              {log.duration_seconds ? ` · ${Math.round(log.duration_seconds)}s` : ''}
                            </div>
                            {log.transcript && (
                              <p className="text-sm line-clamp-3">{log.transcript}</p>
                            )}
                          </div>
                          {log.symbol_id && (
                            <a href={`/registry/${log.symbol_id}`} className="text-xs text-primary underline shrink-0">
                              Linked symbol
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-8">
                {savedSymbols.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    You haven't saved any symbols yet.{' '}
                    <a href="/registry" className="text-primary underline">Browse the registry</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedSymbols.map((symbol) => (
                      <Card key={symbol.id} className="p-6 bg-card border-border">
                        <div className="flex justify-center mb-4">
                          <img
                            src={symbol.image_url}
                            alt={`Saved symbol - ${symbol.tags?.slice(0, 3).join(', ') || 'visual symbol'}`}
                            className="w-[200px] h-[200px] border border-border object-contain bg-white"
                            loading="lazy"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Confirmed by <span className="font-semibold">{symbol.upvotes}</span> viewer{symbol.upvotes !== 1 ? 's' : ''}
                          </p>
                          {symbol.tags && symbol.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center mb-3">
                              {symbol.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unsave(symbol.id)}
                            aria-label="Remove from saved symbols"
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
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

export default Profile;
