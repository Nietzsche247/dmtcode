import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { VotingButtons } from '@/components/registry/VotingButtons';
import { SeenItButton } from '@/components/registry/SeenItButton';
import { useSymbolVoting } from '@/hooks/useSymbolVoting';
import { SaveButton } from '@/components/dashboard/SaveButton';
import { ShareButtons } from '@/components/ShareButtons';
import { Helmet } from 'react-helmet';
import { useRegistryTracking } from '@/hooks/useRegistryTracking';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  ChevronUp, 
  Award, 
  Zap,
  Target
} from 'lucide-react';
import { format } from 'date-fns';

interface SymbolData {
  id: string;
  image_url: string;
  description: string | null;
  tags: string[] | null;
  upvotes: number;
  downvotes: number;
  status: 'pending' | 'approved' | 'rejected';
  source_method: string | null;
  surface_type: string | null;
  wavelength: string | null;
  dose_level: string | null;
  duration_seconds: number | null;
  recurrence: string | null;
  emotional_valence: string | null;
  created_at: string;
  user_id: string;
}

interface ContributorData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  reputation_score: number;
}

interface RelatedSymbol {
  id: string;
  image_url: string;
  tags: string[] | null;
  upvotes: number;
}

interface Validator {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

const SymbolDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackSymbolDetailViewed } = useRegistryTracking();
  
  const [symbol, setSymbol] = useState<SymbolData | null>(null);
  const [contributor, setContributor] = useState<ContributorData | null>(null);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [relatedSymbols, setRelatedSymbols] = useState<RelatedSymbol[]>([]);
  const [validationCount, setValidationCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auto-fire pending "I saw this too" vote on return from /auth
  const { userId, userVotes, seenIt } = useSymbolVoting(id || '', symbol?.user_id);
  const autoFiredRef = useRef(false);
  useEffect(() => {
    const pending = searchParams.get('pendingVote');
    if (
      pending === 'seen_it' &&
      userId &&
      id &&
      !autoFiredRef.current &&
      !userVotes.hasSeenIt
    ) {
      autoFiredRef.current = true;
      seenIt().then(() => {
        searchParams.delete('pendingVote');
        searchParams.delete('authenticated');
        setSearchParams(searchParams, { replace: true });
      });
    } else if (pending === 'seen_it' && userVotes.hasSeenIt) {
      searchParams.delete('pendingVote');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, userId, id, userVotes.hasSeenIt, seenIt, setSearchParams]);

  useEffect(() => {
    if (id) {
      loadSymbol(id);
      trackSymbolDetailViewed(id, 'submission');
    }
  }, [id]);

  const loadSymbol = async (symbolId: string) => {
    setLoading(true);

    // Load symbol data
    const { data: symbolData, error } = await supabase
      .from('symbol_submissions')
      .select('*')
      .eq('id', symbolId)
      .maybeSingle();

    if (error || !symbolData) {
      navigate('/registry');
      return;
    }

    setSymbol(symbolData as SymbolData);

    // Load contributor profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, reputation_score')
      .eq('id', symbolData.user_id)
      .maybeSingle();

    if (profileData) {
      setContributor(profileData);
    }

    // Load validation count (seen_it votes)
    const { count } = await supabase
      .from('symbol_votes')
      .select('*', { count: 'exact', head: true })
      .eq('symbol_id', symbolId)
      .eq('vote_type', 'seen_it');

    setValidationCount(count || 0);

    // Load all votes for view count
    const { count: totalVotes } = await supabase
      .from('symbol_votes')
      .select('*', { count: 'exact', head: true })
      .eq('symbol_id', symbolId);

    setViewCount(totalVotes || 0);

    // Load validators (users who marked "seen_it")
    const { data: votes } = await supabase
      .from('symbol_votes')
      .select('user_id')
      .eq('symbol_id', symbolId)
      .eq('vote_type', 'seen_it')
      .limit(10);

    if (votes && votes.length > 0) {
      const userIds = votes.map(v => v.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        setValidators(profiles.map(p => ({
          user_id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        })));
      }
    }

    // Load related symbols (same tags)
    if (symbolData.tags && symbolData.tags.length > 0) {
      const { data: related } = await supabase
        .from('symbol_submissions')
        .select('id, image_url, tags, upvotes')
        .eq('status', 'approved')
        .neq('id', symbolId)
        .contains('tags', [symbolData.tags[0]])
        .limit(4);

      if (related) {
        setRelatedSymbols(related);
      }
    }

    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLabel = (value: string | null, fallback = 'Not specified') => {
    if (!value) return fallback;
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        <Navigation />
        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!symbol) {
    return null;
  }

  const validationPercentage = viewCount > 0 
    ? Math.round((validationCount / viewCount) * 100) 
    : 0;

  return (
    <>
      <Helmet>
        <title>{`Symbol ${symbol.id.slice(0, 8)} | DMT Code Registry`}</title>
        <meta
          name="description"
          content={symbol.description || 'View symbol details, metadata, and community validations'}
        />
        <link rel="canonical" href={`https://dmtcode.com/registry/${symbol.id}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`Symbol ${symbol.id.slice(0, 8)} | DMT Code Registry`} />
        <meta
          property="og:description"
          content={symbol.description || 'View symbol details, metadata, and community validations on DMT Code.'}
        />
        <meta property="og:url" content={`https://dmtcode.com/registry/${symbol.id}`} />
        <meta property="og:image" content={symbol.image_url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Symbol ${symbol.id.slice(0, 8)} | DMT Code Registry`} />
        <meta
          name="twitter:description"
          content={symbol.description || 'View symbol details, metadata, and community validations on DMT Code.'}
        />
        <meta name="twitter:image" content={symbol.image_url} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "name": `DMT Code Symbol ${symbol.id.slice(0, 8)}`,
            "description": symbol.description,
            "contentUrl": symbol.image_url,
            "datePublished": symbol.created_at,
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "creator": contributor ? {
              "@type": "Person",
              "name": contributor.display_name
            } : undefined
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Back button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/registry')}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registry
            </Button>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Image */}
              <div className="space-y-4">
                <Card className="p-4 bg-white">
                  <img
                    src={symbol.image_url}
                    alt={symbol.description || 'Symbol submission'}
                    className="w-full aspect-square object-contain"
                  />
                </Card>

                {/* Prominent one-tap confirmation */}
                <SeenItButton
                  symbolId={symbol.id}
                  submitterId={symbol.user_id}
                  size="lg"
                  className="w-full justify-center"
                />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <VotingButtons 
                    symbolId={symbol.id} 
                    submitterId={symbol.user_id}
                    variant="full"
                  />
                  <div className="flex items-center gap-2">
                    <SaveButton symbolId={symbol.id} size="default" />
                    <ShareButtons 
                      title={`Symbol ${symbol.id.slice(0, 8)}`}
                      description={symbol.description || 'DMT Code Symbol'}
                      url={`https://dmtcode.com/registry/${symbol.id}`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge 
                      className={
                        symbol.status === 'approved' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : symbol.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {symbol.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(symbol.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Symbol #{symbol.id.slice(0, 8)}</h1>
                  {symbol.description && (
                    <p className="text-muted-foreground">{symbol.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-card/50 text-center">
                    <ChevronUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{symbol.upvotes}</div>
                    <div className="text-xs text-muted-foreground">Upvotes</div>
                  </Card>
                  <Card className="p-4 bg-card/50 text-center">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{validationCount}</div>
                    <div className="text-xs text-muted-foreground">Validations</div>
                  </Card>
                  <Card className="p-4 bg-card/50 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">{validationPercentage}%</div>
                    <div className="text-xs text-muted-foreground">Validated</div>
                  </Card>
                </div>

                {/* Tags */}
                {symbol.tags && symbol.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {symbol.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <Card className="p-4 bg-card/50">
                  <h3 className="font-medium mb-3">Experience Metadata</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <p className="font-medium">{formatLabel(symbol.source_method)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Wavelength:</span>
                      <p className="font-medium">{symbol.wavelength || '650nm'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Surface:</span>
                      <p className="font-medium">{formatLabel(symbol.surface_type)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dose Level:</span>
                      <p className="font-medium">{formatLabel(symbol.dose_level)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recurrence:</span>
                      <p className="font-medium">{formatLabel(symbol.recurrence)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Emotional Tone:</span>
                      <p className="font-medium">{formatLabel(symbol.emotional_valence)}</p>
                    </div>
                    {symbol.duration_seconds && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {symbol.duration_seconds}s
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Contributor */}
                {contributor && (
                  <Card className="p-4 bg-card/50">
                    <h3 className="font-medium mb-3">Contributor</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contributor.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(contributor.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{contributor.display_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Reputation: {contributor.reputation_score}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Validators */}
                {validators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Validated by ({validationCount} users)
                    </h3>
                    <div className="flex -space-x-2">
                      {validators.slice(0, 8).map((v, i) => (
                        <Avatar key={i} className="w-8 h-8 border-2 border-background">
                          <AvatarImage src={v.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(v.display_name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {validationCount > 8 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                          +{validationCount - 8}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Symbols */}
            {relatedSymbols.length > 0 && (
              <div className="mt-16">
                <h2 className="text-xl font-bold mb-6">Related Symbols</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedSymbols.map((related) => (
                    <Link key={related.id} to={`/registry/${related.id}`}>
                      <Card className="p-3 bg-card/50 hover:border-primary/50 transition-colors">
                        <div className="aspect-square bg-white rounded border border-border overflow-hidden mb-2">
                          <img
                            src={related.image_url}
                            alt="Related symbol"
                            className="w-full h-full object-contain p-1"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ChevronUp className="w-3 h-3" />
                            {related.upvotes}
                          </span>
                          {related.tags && related.tags[0] && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {related.tags[0]}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SymbolDetail;
