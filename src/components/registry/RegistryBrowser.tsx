import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { TagsManager } from './TagsManager';
import { ShareButtons } from '@/components/ShareButtons';
import { VotingButtons } from './VotingButtons';
import { SaveButton } from '@/components/dashboard/SaveButton';

interface RegistryGlyph {
  id: string;
  image_data: string;
  confirmation_count: number;
  motif_tags: string[];
  created_at: string;
  symmetry: string | null;
  emotional_valence: string | null;
  user_id: string | null;
}

export const RegistryBrowser = () => {
  const [glyphs, setGlyphs] = useState<RegistryGlyph[]>([]);
  const [filteredGlyphs, setFilteredGlyphs] = useState<RegistryGlyph[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [userId, setUserId] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [symmetryFilter, setSymmetryFilter] = useState<string>('all');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');

  useEffect(() => {
    checkUser();
    loadGlyphs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('registry-browser')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'registry_glyphs' 
      }, () => {
        loadGlyphs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [glyphs, tagFilter, symmetryFilter, emotionFilter]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadStarredGlyphs(user.id);
    }
  };

  const loadStarredGlyphs = async (uid: string) => {
    const { data } = await supabase
      .from('glyph_votes')
      .select('glyph_id')
      .eq('user_id', uid);
    
    if (data) {
      setStarredIds(new Set(data.map(v => v.glyph_id)));
    }
  };

  const loadGlyphs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, confirmation_count, motif_tags, created_at, symmetry, emotional_valence, user_id')
      .order('confirmation_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGlyphs(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...glyphs];

    if (tagFilter !== 'all') {
      filtered = filtered.filter(g => 
        g.motif_tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    if (symmetryFilter !== 'all') {
      filtered = filtered.filter(g => g.symmetry === symmetryFilter);
    }

    if (emotionFilter !== 'all') {
      filtered = filtered.filter(g => g.emotional_valence === emotionFilter);
    }

    setFilteredGlyphs(filtered);
  };

  const handleVote = async (glyphId: string, type: 'exact' | 'similar' | 'not_match') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('registry_confirmations').insert({
        glyph_id: glyphId,
        user_id: userData.user?.id || null,
        session_id: sessionId,
        confirmation_type: type
      });

      if (error) throw error;

      // Update confirmation count if exact or similar
      if (type === 'exact' || type === 'similar') {
        const glyph = glyphs.find(g => g.id === glyphId);
        if (glyph) {
          await supabase
            .from('registry_glyphs')
            .update({ confirmation_count: glyph.confirmation_count + 1 })
            .eq('id', glyphId);
        }
      }

      toast.success('Recorded');
      loadGlyphs();
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleStar = async (glyphId: string) => {
    if (!userId) {
      toast.error('Please log in to star symbols');
      return;
    }

    try {
      if (starredIds.has(glyphId)) {
        // Unstar
        await supabase
          .from('glyph_votes')
          .delete()
          .eq('glyph_id', glyphId)
          .eq('user_id', userId);
        
        const newStarred = new Set(starredIds);
        newStarred.delete(glyphId);
        setStarredIds(newStarred);
        toast.success('Removed from stars');
      } else {
        // Star
        await supabase
          .from('glyph_votes')
          .insert({
            glyph_id: glyphId,
            user_id: userId
          });
        
        setStarredIds(new Set([...starredIds, glyphId]));
        toast.success('Added to stars');
      }
    } catch (error) {
      console.error('Star error:', error);
      toast.error('Failed to star symbol');
    }
  };

  const handleFlag = async (glyphId: string) => {
    if (!userId) {
      toast.error('Please log in to flag symbols');
      return;
    }

    try {
      await supabase.from('registry_confirmations').insert({
        glyph_id: glyphId,
        user_id: userId,
        session_id: sessionId,
        confirmation_type: 'flag'
      });

      toast.success('Symbol flagged for review');
    } catch (error) {
      console.error('Flag error:', error);
      toast.error('Failed to flag symbol');
    }
  };

  return (
    <section id="browse" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Browse Registry</h2>
      
      {/* Credibility Legend */}
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' }}>
          <span className="flex items-center gap-1.5">👍 <span className="text-xs">Seen this glyph</span></span>
          <span className="flex items-center gap-1.5">👎 <span className="text-xs">Did not see</span></span>
          <span className="flex items-center gap-1.5">✅ <span className="text-xs">Multiple confirmations</span></span>
          <span className="flex items-center gap-1.5">⭐ <span className="text-xs">High consistency</span></span>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              <SelectItem value="geometric">Geometric</SelectItem>
              <SelectItem value="alphabetic">Alphabetic</SelectItem>
              <SelectItem value="spiral">Spiral</SelectItem>
              <SelectItem value="organic">Organic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={symmetryFilter} onValueChange={setSymmetryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by symmetry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symmetry</SelectItem>
              <SelectItem value="bilateral">Bilateral</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={emotionFilter} onValueChange={setEmotionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by emotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emotions</SelectItem>
              <SelectItem value="instructional">Instructional</SelectItem>
              <SelectItem value="benevolent">Benevolent</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground mb-6">
        Showing {filteredGlyphs.length} of {glyphs.length} symbols
      </div>
      
      {filteredGlyphs.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No symbols match your filters. Try adjusting your selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGlyphs.map((glyph) => (
            <Card key={glyph.id} className="p-6 bg-card border-border">
              <div className="flex justify-center mb-4 relative">
                <img 
                  src={glyph.image_data} 
                  alt={`Registry glyph symbol - ${glyph.motif_tags?.slice(0, 3).join(', ') || 'visual symbol'} - reported ${glyph.confirmation_count} times`}
                  className="w-[200px] h-[200px] border border-border"
                  style={{ imageRendering: 'auto' }}
                  loading="lazy"
                />
                <div className="absolute top-0 right-0 flex items-center gap-1">
                  <ShareButtons 
                    title={`DMT Glyph #${glyph.id.slice(0, 8)}`} 
                    description={glyph.motif_tags?.slice(0, 3).join(', ') || 'Visual symbol'} 
                    url={`https://dmtcode.com/registry#${glyph.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStar(glyph.id)}
                    aria-label={starredIds.has(glyph.id) ? "Unstar symbol" : "Star symbol"}
                  >
                    <Star className={`w-5 h-5 ${starredIds.has(glyph.id) ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Independently reported by <span className="font-semibold text-foreground">{glyph.confirmation_count}</span> participant{glyph.confirmation_count !== 1 ? 's' : ''}
                </p>
                
                <TagsManager glyphId={glyph.id} />
                
                {glyph.motif_tags && glyph.motif_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    <span className="text-xs text-muted-foreground">Original tags:</span>
                    {glyph.motif_tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Voting Buttons */}
              <div className="flex items-center justify-between mb-3">
                <VotingButtons 
                  symbolId={glyph.id} 
                  submitterId={glyph.user_id || undefined}
                  variant="compact"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFlag(glyph.id)}
                  aria-label="Flag symbol for review"
                  className="text-destructive hover:text-destructive"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleVote(glyph.id, 'exact')}
                  aria-label={`Vote I've seen this too - exact match for glyph with ${glyph.confirmation_count} confirmations`}
                >
                  ★ Confirm Match
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleVote(glyph.id, 'similar')}
                    aria-label={`Vote similar for glyph with ${glyph.confirmation_count} confirmations`}
                  >
                    Similar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleVote(glyph.id, 'not_match')}
                    aria-label={`Vote not matching for glyph with ${glyph.confirmation_count} confirmations`}
                  >
                    Different
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
