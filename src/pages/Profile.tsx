import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

interface UserSymbol {
  id: string;
  image_data: string;
  confirmation_count: number;
  motif_tags: string[];
  created_at: string;
  source: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [mySymbols, setMySymbols] = useState<UserSymbol[]>([]);
  const [starredSymbols, setStarredSymbols] = useState<UserSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to view your profile');
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    loadMySymbols(user.id);
    loadStarredSymbols(user.id);
  };

  const loadMySymbols = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, confirmation_count, motif_tags, created_at, source')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMySymbols(data);
    }
    setLoading(false);
  };

  const loadStarredSymbols = async (uid: string) => {
    // Get starred glyph IDs from glyph_votes
    const { data: votes } = await supabase
      .from('glyph_votes')
      .select('glyph_id')
      .eq('user_id', uid);

    if (votes && votes.length > 0) {
      const glyphIds = votes.map(v => v.glyph_id);
      const { data: glyphs } = await supabase
        .from('registry_glyphs')
        .select('id, image_data, confirmation_count, motif_tags, created_at, source')
        .in('id', glyphIds)
        .order('created_at', { ascending: false });

      if (glyphs) {
        setStarredSymbols(glyphs);
      }
    }
  };

  const unstar = async (glyphId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('glyph_votes')
      .delete()
      .eq('glyph_id', glyphId)
      .eq('user_id', userId);

    if (!error) {
      toast.success('Symbol removed from starred');
      loadStarredSymbols(userId);
    }
  };

  return (
    <>
      <Helmet>
        <title>My Profile | DMT Code Visual Symbol Catalogue</title>
        <meta name="description" content="View your submitted symbols and starred glyphs from the community registry" />
        <link rel="canonical" href="https://dmtcode.com/profile" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8">My Profile</h1>

            <Tabs defaultValue="my-symbols" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="my-symbols">My Symbols ({mySymbols.length})</TabsTrigger>
                <TabsTrigger value="starred">Starred ({starredSymbols.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="my-symbols" className="mt-8">
                {loading ? (
                  <div className="text-center text-muted-foreground">Loading your symbols...</div>
                ) : mySymbols.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    You haven't submitted any symbols yet.{' '}
                    <a href="/registry#submit" className="text-primary underline">Submit your first symbol</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mySymbols.map((symbol) => (
                      <Card key={symbol.id} className="p-6 bg-card border-border">
                        <div className="flex justify-center mb-4">
                          <img
                            src={symbol.image_data}
                            alt={`Your symbol - ${symbol.motif_tags?.slice(0, 3).join(', ') || 'visual symbol'}`}
                            className="w-[100px] h-[100px] border border-border"
                            style={{ imageRendering: 'pixelated' }}
                            loading="lazy"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Confirmed by <span className="font-semibold">{symbol.confirmation_count}</span> participant{symbol.confirmation_count !== 1 ? 's' : ''}
                          </p>
                          <Badge variant="outline" className="mb-3">{symbol.source}</Badge>
                          {symbol.motif_tags && symbol.motif_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center">
                              {symbol.motif_tags.slice(0, 3).map((tag, idx) => (
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

              <TabsContent value="starred" className="mt-8">
                {starredSymbols.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    You haven't starred any symbols yet.{' '}
                    <a href="/registry#browse" className="text-primary underline">Browse the registry</a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {starredSymbols.map((symbol) => (
                      <Card key={symbol.id} className="p-6 bg-card border-border">
                        <div className="flex justify-center mb-4">
                          <img
                            src={symbol.image_data}
                            alt={`Starred symbol - ${symbol.motif_tags?.slice(0, 3).join(', ') || 'visual symbol'}`}
                            className="w-[100px] h-[100px] border border-border"
                            style={{ imageRendering: 'pixelated' }}
                            loading="lazy"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Confirmed by <span className="font-semibold">{symbol.confirmation_count}</span> participant{symbol.confirmation_count !== 1 ? 's' : ''}
                          </p>
                          {symbol.motif_tags && symbol.motif_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center mb-3">
                              {symbol.motif_tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unstar(symbol.id)}
                            aria-label="Remove from starred symbols"
                          >
                            Unstar
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
