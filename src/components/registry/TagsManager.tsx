import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id: string;
  tag_name: string;
  upvotes: number;
  user_id: string | null;
}

interface TagsManagerProps {
  glyphId: string;
}

export const TagsManager = ({ glyphId }: TagsManagerProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [votedTags, setVotedTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
    loadTags();
  }, [glyphId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadVotedTags(user.id);
    }
  };

  const loadTags = async () => {
    const { data } = await supabase
      .from('symbol_tags')
      .select('*')
      .eq('glyph_id', glyphId)
      .order('upvotes', { ascending: false })
      .limit(5);

    if (data) {
      setTags(data);
    }
  };

  const loadVotedTags = async (uid: string) => {
    const { data } = await supabase
      .from('symbol_tag_votes')
      .select('tag_id')
      .eq('user_id', uid);

    if (data) {
      setVotedTags(new Set(data.map(v => v.tag_id)));
    }
  };

  const addTag = async () => {
    if (!userId) {
      toast.error('Please log in to add tags');
      return;
    }

    if (!newTag.trim()) {
      toast.error('Please enter a tag');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('symbol_tags')
      .insert({
        glyph_id: glyphId,
        tag_name: newTag.trim().toLowerCase(),
        user_id: userId
      });

    if (error) {
      toast.error('Failed to add tag');
    } else {
      toast.success('Tag added');
      setNewTag('');
      loadTags();
    }
    setLoading(false);
  };

  const toggleVote = async (tagId: string) => {
    if (!userId) {
      toast.error('Please log in to vote on tags');
      return;
    }

    const hasVoted = votedTags.has(tagId);

    if (hasVoted) {
      await supabase
        .from('symbol_tag_votes')
        .delete()
        .eq('tag_id', tagId)
        .eq('user_id', userId);

      const newVoted = new Set(votedTags);
      newVoted.delete(tagId);
      setVotedTags(newVoted);
      toast.success('Vote removed');
    } else {
      await supabase
        .from('symbol_tag_votes')
        .insert({
          tag_id: tagId,
          user_id: userId
        });

      setVotedTags(new Set([...votedTags, tagId]));
      toast.success('Recorded');
    }

    loadTags();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add a tag (e.g., geometric, spiral)"
          onKeyDown={(e) => e.key === 'Enter' && addTag()}
          className="flex-1"
        />
        <Button
          onClick={addTag}
          disabled={loading || !newTag.trim()}
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-2 py-1 px-3 cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleVote(tag.id)}
            >
              <span>{tag.tag_name}</span>
              <span className="flex items-center gap-1 text-xs">
                <ThumbsUp className={`w-3 h-3 ${votedTags.has(tag.id) ? 'fill-primary' : ''}`} />
                {tag.upvotes}
              </span>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Suggested (30 tags): geometric, alphabetic, radial, spiral, pulsing, instructional, pareidolia, speckle, gematria, organic, fractal, bilateral, asymmetric, morphing, static, scrolling, archetypes, sand, toilet-bowl, ceiling, eyelids, hand, katakana-like, benevolent, unsettling, neutral, 2D, 3D, 4D, symbolic
      </p>
    </div>
  );
};
