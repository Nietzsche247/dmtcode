import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Users, Sparkles } from 'lucide-react';
import { ContextTermPicker } from './ContextTermPicker';
import { toast } from 'sonner';

interface CommunityTag {
  id: string;
  tag_name: string;
  upvotes: number;
  user_id: string | null;
  kind?: string | null;
}

interface Props {
  symbolId: string;
  submitterContext?: string | null;
  submitterNote?: string | null;
  submitterId?: string;
}

/**
 * Two-bucket context panel.
 * Bucket A (Submitter): displayed above, read-only, single term + optional note.
 * Bucket B (Community): confirmations of felt context from viewers who saw it too.
 * Never mutates symbol_votes. Server RLS blocks submitters from tagging their own symbols.
 */
export const SymbolContextPanel = ({
  symbolId,
  submitterContext,
  submitterNote,
  submitterId,
}: Props) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [tags, setTags] = useState<CommunityTag[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [myPick, setMyPick] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSubmitter = !!userId && userId === submitterId;

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('symbol_tags')
      .select('id,tag_name,upvotes,user_id,kind' as any)
      .eq('symbol_id', symbolId)
      .order('upvotes', { ascending: false });
    setTags(((data as unknown) as CommunityTag[]) || []);
  }, [symbolId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (user) {
        const { data: v } = await supabase
          .from('symbol_tag_votes')
          .select('tag_id')
          .eq('user_id', user.id);
        setVoted(new Set((v || []).map((r: any) => r.tag_id)));
      }
    })();
    load();
  }, [load]);

  const addContext = async () => {
    if (!userId) {
      toast.error('Sign in to add context');
      return;
    }
    if (isSubmitter) {
      toast.error("You can't confirm your own submission");
      return;
    }
    if (!myPick) return;
    setLoading(true);
    const { error } = await supabase.from('symbol_tags').insert({
      symbol_id: symbolId,
      user_id: userId,
      tag_name: myPick,
      kind: 'context' as any,
    } as any);
    if (error) {
      // Likely duplicate; upvote instead if we can find the row.
      const existing = tags.find((t) => t.tag_name === myPick);
      if (existing && !voted.has(existing.id)) {
        await toggleUpvote(existing.id);
      } else {
        toast.error('Could not add that context');
      }
    } else {
      toast.success('Context confirmed');
      setMyPick(null);
      load();
    }
    setLoading(false);
  };

  const toggleUpvote = async (tagId: string) => {
    if (!userId) return toast.error('Sign in to confirm');
    if (isSubmitter) return toast.error("You can't confirm your own submission");
    const has = voted.has(tagId);
    if (has) {
      await supabase.from('symbol_tag_votes').delete().eq('tag_id', tagId).eq('user_id', userId);
      const s = new Set(voted); s.delete(tagId); setVoted(s);
    } else {
      const { error } = await supabase.from('symbol_tag_votes').insert({ tag_id: tagId, user_id: userId });
      if (error) return toast.error('Could not confirm');
      setVoted(new Set([...voted, tagId]));
    }
    load();
  };

  return (
    <div className="space-y-4">
      {/* Bucket A — Submitter Context */}
      <Card className="p-4 bg-card/60 border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Submitter context</h3>
          <Badge variant="outline" className="text-[10px]">from the contributor</Badge>
        </div>
        {submitterContext ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-xs">{submitterContext}</Badge>
            {submitterNote && (
              <p className="text-sm text-muted-foreground">{submitterNote}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">The contributor did not label a context.</p>
        )}
      </Card>

      {/* Bucket B — Community Context */}
      <Card className="p-4 bg-card/60">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Where others saw it</h3>
          <Badge variant="outline" className="text-[10px]">community confirmed</Badge>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleUpvote(t.id)}
                disabled={isSubmitter}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs hover:border-primary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{t.tag_name}</span>
                <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                  <ThumbsUp className={`w-3 h-3 ${voted.has(t.id) ? 'fill-primary text-primary' : ''}`} />
                  {t.upvotes}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-4">
            No one else has confirmed a context yet. If you've seen this, add where.
          </p>
        )}

        {!isSubmitter && userId && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Did you see this too? Confirm where.
            </p>
            <ContextTermPicker value={myPick} onChange={setMyPick} />
            <div className="flex justify-end">
              <Button size="sm" onClick={addContext} disabled={!myPick || loading}>
                Confirm context
              </Button>
            </div>
          </div>
        )}
        {isSubmitter && (
          <p className="text-[11px] text-muted-foreground italic">
            You can't confirm context on your own submission.
          </p>
        )}
        {!userId && (
          <p className="text-[11px] text-muted-foreground">Sign in to confirm where you saw it.</p>
        )}
      </Card>
    </div>
  );
};
