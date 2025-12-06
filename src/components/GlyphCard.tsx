import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GlyphCardProps {
  glyph: {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    upvotes: number;
    created_at: string;
    user_id: string;
    profiles?: {
      display_name: string;
      avatar_url: string | null;
    };
  };
  tags?: Array<{
    id: string;
    tag_name: string;
    upvotes: number;
  }>;
  onVoteChange?: () => void;
}

export const GlyphCard = ({ glyph, tags = [], onVoteChange }: GlyphCardProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(glyph.upvotes);
  const [tagVotes, setTagVotes] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndVotes();
  }, [glyph.id]);

  const checkAuthAndVotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);

    if (user) {
      // Check if user has voted on glyph
      const { data: voteData } = await supabase
        .from('glyph_votes')
        .select('id')
        .eq('glyph_id', glyph.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setHasVoted(!!voteData);

      // Check tag votes
      if (tags.length > 0) {
        const { data: tagVoteData } = await supabase
          .from('tag_votes')
          .select('tag_id')
          .in('tag_id', tags.map(t => t.id))
          .eq('user_id', user.id);

        const votedTags: Record<string, boolean> = {};
        tagVoteData?.forEach(v => {
          votedTags[v.tag_id] = true;
        });
        setTagVotes(votedTags);
      }
    }
  };

  const handleGlyphVote = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to vote");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (hasVoted) {
        await supabase
          .from('glyph_votes')
          .delete()
          .eq('glyph_id', glyph.id)
          .eq('user_id', user.id);
        
        setLocalUpvotes(prev => prev - 1);
        setHasVoted(false);
      } else {
        await supabase
          .from('glyph_votes')
          .insert({ glyph_id: glyph.id, user_id: user.id });
        
        setLocalUpvotes(prev => prev + 1);
        setHasVoted(true);
      }
      onVoteChange?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTagVote = async (tagId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to vote");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const hasVotedOnTag = tagVotes[tagId];

      if (hasVotedOnTag) {
        await supabase
          .from('tag_votes')
          .delete()
          .eq('tag_id', tagId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('tag_votes')
          .insert({ tag_id: tagId, user_id: user.id });
      }

      setTagVotes(prev => ({
        ...prev,
        [tagId]: !hasVotedOnTag
      }));
      onVoteChange?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{glyph.title}</h3>
          {glyph.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {glyph.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 w-[30px] h-[30px] border border-border rounded overflow-hidden">
          <img 
            src={glyph.image_url} 
            alt={`DMT glyph archetype: ${glyph.title}${glyph.description ? ` - ${glyph.description.substring(0, 50)}` : ''}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={hasVoted ? "default" : "outline"}
          size="sm"
          onClick={handleGlyphVote}
          className="h-7 px-2 min-h-[44px] min-w-[44px]"
          aria-label={hasVoted ? `Remove upvote from ${glyph.title}, current votes: ${localUpvotes}` : `Upvote ${glyph.title}, current votes: ${localUpvotes}`}
          aria-pressed={hasVoted}
        >
          <ChevronUp className="h-3 w-3 mr-1" aria-hidden="true" />
          {localUpvotes}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={glyph.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {glyph.profiles?.display_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span>{glyph.profiles?.display_name || "Anonymous"}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Button
              key={tag.id}
              variant={tagVotes[tag.id] ? "default" : "outline"}
              size="sm"
              onClick={() => handleTagVote(tag.id)}
              className="h-6 px-2 text-xs"
            >
              <ChevronUp className="h-2.5 w-2.5 mr-1" />
              {tag.tag_name} ({tag.upvotes + (tagVotes[tag.id] ? 1 : 0)})
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};
