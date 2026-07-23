import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { toast } from 'sonner';
import { HandMetal } from 'lucide-react';

interface CoWitness {
  user_id: string;
  handle: string;
  avatar_seed: string;
  surface_type: string | null;
  context_note: string | null;
  visibility: 'pairs_only' | 'wall';
}

interface Props {
  symbolId: string;
  viewerId: string | null;
  viewerHasSeenIt: boolean;
  viewerSurfaceType?: string | null;
}

const formatContext = (s?: string | null) =>
  s ? s.replace(/_/g, ' ') : null;

/**
 * Co-witness module. Shown ONLY to a viewer who holds a seen_it on this symbol AND
 * whose own prefs are pairs_only/wall. Reads symbol_votes via SECURITY DEFINER RPC.
 * Writes only to co_witness_high_fives and co_witness_recollections.
 */
export const CoWitnessModule = ({ symbolId, viewerId, viewerHasSeenIt, viewerSurfaceType }: Props) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [pairs, setPairs] = useState<CoWitness[]>([]);
  const [highFived, setHighFived] = useState<Record<string, boolean>>({});
  const [mutual, setMutual] = useState<Record<string, boolean>>({});
  const [recollection, setRecollection] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!viewerId || !viewerHasSeenIt) {
      setReady(true);
      return;
    }
    const { data: prefs } = await (supabase as any)
      .from('co_witness_prefs')
      .select('visibility')
      .eq('user_id', viewerId)
      .maybeSingle();
    const visible = prefs && prefs.visibility !== 'private';
    setViewerVisible(!!visible);
    if (!visible) {
      setReady(true);
      return;
    }

    const { data: rpc } = await (supabase as any).rpc('get_co_witnesses', { _symbol_id: symbolId });
    const list = ((rpc as CoWitness[]) || []).filter((r) => r.user_id !== viewerId);
    setPairs(list);

    if (list.length) {
      const others = list.map((r) => r.user_id);
      // My outgoing high-fives on this symbol
      const { data: mine } = await (supabase as any)
        .from('co_witness_high_fives')
        .select('to_user')
        .eq('from_user', viewerId)
        .eq('symbol_id', symbolId)
        .in('to_user', others);
      const outMap: Record<string, boolean> = {};
      (mine || []).forEach((r: any) => { outMap[r.to_user] = true; });
      setHighFived(outMap);

      // Their incoming toward me = mutual
      const { data: theirs } = await (supabase as any)
        .from('co_witness_high_fives')
        .select('from_user')
        .eq('to_user', viewerId)
        .eq('symbol_id', symbolId)
        .in('from_user', others);
      const mutualMap: Record<string, boolean> = {};
      (theirs || []).forEach((r: any) => {
        if (outMap[r.from_user]) mutualMap[r.from_user] = true;
      });
      setMutual(mutualMap);
    }
    setReady(true);
  }, [symbolId, viewerId, viewerHasSeenIt]);

  useEffect(() => { load(); }, [load]);

  const highFive = async (toUser: string) => {
    if (!viewerId) return;
    const { error } = await (supabase as any)
      .from('co_witness_high_fives')
      .insert({ from_user: viewerId, to_user: toUser, symbol_id: symbolId });
    if (error) {
      toast.error('Could not send');
      return;
    }
    setHighFived((m) => ({ ...m, [toUser]: true }));
    toast.success('Sent');
    // Re-check mutual state
    const { data: theirs } = await (supabase as any)
      .from('co_witness_high_fives')
      .select('from_user')
      .eq('to_user', viewerId)
      .eq('symbol_id', symbolId)
      .eq('from_user', toUser)
      .maybeSingle();
    if (theirs) setMutual((m) => ({ ...m, [toUser]: true }));
  };

  const postRecollection = async () => {
    if (!viewerId) return;
    const body = recollection.trim();
    if (!body) return;
    if (body.length > 500) {
      toast.error('Keep it under 500 characters');
      return;
    }
    setPosting(true);
    const { error } = await (supabase as any)
      .from('co_witness_recollections')
      .insert({
        user_id: viewerId,
        symbol_id: symbolId,
        context_term: viewerSurfaceType || null,
        body,
      });
    setPosting(false);
    if (error) {
      toast.error('Could not post');
      return;
    }
    setRecollection('');
    toast.success('Added to the wall');
  };

  if (!ready) return null;
  // Hide entirely if viewer has no seen_it or is private. Never prompt them.
  if (!viewerId || !viewerHasSeenIt || !viewerVisible) return null;

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-medium text-base">Co-witnesses</h3>
        <p className="text-sm text-muted-foreground">
          Other people who also recognized this symbol. Handles only. No PII.
        </p>
      </div>

      {pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No one else has opted in for this symbol yet. When they do, you will see them here.
        </p>
      ) : (
        <ul className="space-y-3">
          {pairs.map((p) => {
            const yourCtx = formatContext(viewerSurfaceType);
            const theirCtx = formatContext(p.surface_type);
            const line =
              yourCtx && theirCtx
                ? `You on a ${yourCtx}, them on a ${theirCtx}.`
                : yourCtx
                ? `You on a ${yourCtx}.`
                : theirCtx
                ? `Them on a ${theirCtx}.`
                : null;
            const hf = !!highFived[p.user_id];
            const mu = !!mutual[p.user_id];
            return (
              <li key={p.user_id} className="flex items-start gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                <AvatarGlyph seed={p.avatar_seed} handle={p.handle} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    You and <span className="font-medium">@{p.handle}</span> both recognized this symbol.
                  </div>
                  {line && <div className="text-xs text-muted-foreground mt-0.5">{line}</div>}
                  {mu && (
                    <div className="text-xs text-primary mt-1">Mutual high-five.</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={hf ? 'secondary' : 'outline'}
                  onClick={() => !hf && highFive(p.user_id)}
                  disabled={hf}
                  aria-label={hf ? 'High-five sent' : 'Send I believe you high-five'}
                >
                  <HandMetal className="w-3.5 h-3.5 mr-1" />
                  {hf ? 'Sent' : 'I believe you'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-border pt-4 space-y-2">
        <div className="text-sm font-medium">Add a recollection</div>
        <p className="text-xs text-muted-foreground">
          A short field note about where or when you saw this. Appears on the co-witness wall if your visibility is set to Wall.
        </p>
        <Textarea
          value={recollection}
          onChange={(e) => setRecollection(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="A short field note."
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{recollection.length}/500</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/co-witnesses">Open the wall</Link>
            </Button>
            <Button size="sm" onClick={postRecollection} disabled={posting || !recollection.trim()}>
              {posting ? 'Posting.' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
