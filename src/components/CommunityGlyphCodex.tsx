import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlyphCard } from "./GlyphCard";
import { GlyphUploadModal } from "./GlyphUploadModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const CommunityGlyphCodex = () => {
  const navigate = useNavigate();
  const [glyphs, setGlyphs] = useState<any[]>([]);
  const [glyphTags, setGlyphTags] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    loadGlyphs();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const loadGlyphs = async () => {
    setLoading(true);
    
    try {
      // Load glyphs with user profiles
      const { data: glyphsData, error: glyphsError } = await supabase
        .from('glyphs')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .order('upvotes', { ascending: false })
        .limit(50);

      if (glyphsError) throw glyphsError;

      if (glyphsData) {
        setGlyphs(glyphsData);

        // Load tags for each glyph
        const tagsData: Record<string, any[]> = {};
        
        for (const glyph of glyphsData) {
          const { data: tags, error: tagsError } = await supabase
            .from('surface_tags')
            .select('*')
            .eq('glyph_id', glyph.id)
            .order('upvotes', { ascending: false });

          if (!tagsError && tags) {
            tagsData[glyph.id] = tags;
          }
        }

        setGlyphTags(tagsData);
      }
    } catch (error) {
      console.error("Error loading glyphs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      toast.info("Please login to upload glyphs");
      navigate("/auth");
      return;
    }
    setIsUploadOpen(true);
  };

  return (
    <section id="codex" className="relative py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Reality's Living Code – Community-Verified Glyph Codex
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            30×30 px emoji-scale glyphs with upvoting and surface/environment tagging
          </p>
          
          <Button 
            size="lg" 
            onClick={handleUploadClick}
            className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground mt-6"
          >
            <Upload className="h-5 w-5" />
            Upload Your Symbols
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading glyphs...</p>
          </div>
        ) : glyphs.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-xl text-muted-foreground">No glyphs found</p>
            <p className="text-sm text-muted-foreground">
              Be the first to upload a glyph discovered in your DMT code experience
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {glyphs.map((glyph) => (
              <GlyphCard
                key={glyph.id}
                glyph={glyph}
                tags={glyphTags[glyph.id] || []}
                onVoteChange={loadGlyphs}
              />
            ))}
          </div>
        )}
      </div>

      <GlyphUploadModal 
        open={isUploadOpen} 
        onOpenChange={setIsUploadOpen}
        onSuccess={loadGlyphs}
      />
    </section>
  );
};
