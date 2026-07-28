import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SeenItButton } from './SeenItButton';
import { formatSealedAt } from '@/lib/sealFormat';

type TargetKind = 'symbol_submission' | 'registry_glyph';

type ResponseType =
  | 'independent_prior_record'
  | 'same_location'
  | 'similar_without_laser'
  | 'contradictory_null'
  | 'field_note';

interface SymbolResponsePanelProps {
  targetId: string;
  target?: TargetKind;
  submitterId?: string;
  imageUrl?: string;
}

interface MyResponse {
  id: string;
  response_type: string;
  review_status: string;
}

interface SealedMemory {
  id: string;
  sealed_at: string;
  description: string | null;
}

type Counts = Record<string, number>;

const COUNT_LABELS: [string, string][] = [
  ['independent_prior_record', 'independent prior records'],
  ['independent_prior_record_blind', 'of those, recorded before any catalogue exposure'],
  ['candidate_match', 'awaiting review'],
  ['reviewed_match', 'reviewed and matched'],
  ['same_location', 'same location in the visual field'],
  ['similar_without_laser', 'similar form without the laser'],
  ['contradictory_null', 'looked and saw nothing like this'],
  ['field_note', 'field notes'],
];

const SIMPLE_RESPONSES: { type: ResponseType; label: string }[] = [
  { type: 'same_location', label: 'I saw it in the same location in my visual field' },
  { type: 'similar_without_laser', label: 'I saw a similar form without the laser' },
  { type: 'contradictory_null', label: 'I looked and I saw nothing like this' },
];

export const SymbolResponsePanel = ({
  targetId,
  target = 'symbol_submission',
  submitterId,
  imageUrl,
}: SymbolResponsePanelProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({});
  const [mine, setMine] = useState<MyResponse[]>([]);
  const [memories, setMemories] = useState<SealedMemory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCounts = useCallback(async () => {
    const { data } = await supabase.rpc('symbol_response_counts', {
      p_target: target,
      p_target_id: targetId,
    });
    setCounts((data as Counts) || {});
  }, [target, targetId]);

  const loadMine = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('symbol_responses')
      .select('id, response_type, review_status')
      .eq('user_id', uid)
      .eq('target', target)
      .eq('target_id', targetId);
    setMine(data || []);
  }, [target, targetId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      await loadCounts();
      if (user?.id) {
        await loadMine(user.id);
        const { data: glyphs } = await supabase
          .from('registry_glyphs')
          .select('id, sealed_at, description, capture_route, prior_exposure')
          .eq('user_id', user.id)
          .not('sealed_at', 'is', null)
          .order('sealed_at', { ascending: false });
        if (!active) return;
        setMemories(
          (glyphs || []).map((g: any) => ({
            id: g.id,
            sealed_at: g.sealed_at,
            description: g.description ?? null,
          })),
        );
      }
    })();
    return () => { active = false; };
  }, [loadCounts, loadMine]);

  const existing = (type: ResponseType) => mine.find((m) => m.response_type === type);

  const refresh = async () => {
    await loadCounts();
    if (userId) await loadMine(userId);
  };

  const withdraw = async (rowId: string) => {
    setBusy(true);
    const { error } = await supabase.from('symbol_responses').delete().eq('id', rowId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  };

  const record = async (type: ResponseType, linkedGlyphId?: string, noteText?: string) => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase.from('symbol_responses').insert({
      user_id: userId,
      target,
      target_id: targetId,
      response_type: type,
      linked_glyph_id: linkedGlyphId ?? null,
      note: noteText ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  };

  const toggle = async (type: ResponseType) => {
    const row = existing(type);
    if (row) {
      await withdraw(row.id);
    } else {
      await record(type);
    }
  };

  const priorRow = existing('independent_prior_record');

  const handlePrior = async () => {
    if (priorRow) {
      await withdraw(priorRow.id);
      return;
    }
    if (!selectedMemory) {
      toast.error('Choose the sealed memory this points to.');
      return;
    }
    await record('independent_prior_record', selectedMemory);
  };

  const handleNote = async () => {
    if (!note.trim()) return;
    await record('field_note', undefined, note.trim());
    setNote('');
  };

  const visibleCounts = COUNT_LABELS.filter(([key]) => Number(counts[key] || 0) > 0);

  return (
    <Card className="p-5 bg-card/50 space-y-8">
      <h2 className="font-medium text-lg">How does this compare with what you saw?</h2>

      {/* PART A */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Community recognition</h3>
        <SeenItButton
          symbolId={targetId}
          submitterId={submitterId}
          size="lg"
          className="w-full justify-center"
          imageUrl={imageUrl}
        />
        <p className="text-xs text-muted-foreground">
          Recognition after viewing tells us what the community responds to. It is not evidence,
          because you have already seen the image.
        </p>
      </section>

      {/* PART B */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Responses that can become evidence</h3>

        {!userId && (
          <p className="text-xs text-muted-foreground">
            Sign in to record a structured response.{' '}
            <Link
              to={`/auth?returnTo=/registry/${targetId}`}
              className="underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            variant={priorRow ? 'default' : 'outline'}
            className="w-full justify-start rounded-full"
            disabled={!userId || busy || memories.length === 0}
            onClick={handlePrior}
          >
            {priorRow && <Check className="w-4 h-4 mr-2" />}
            I independently recorded something similar
          </Button>

          {userId && memories.length > 0 && !priorRow && (
            <Select value={selectedMemory} onValueChange={setSelectedMemory}>
              <SelectTrigger>
                <SelectValue placeholder="Choose one of your sealed memories" />
              </SelectTrigger>
              <SelectContent>
                {memories.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {formatSealedAt(m.sealed_at)}
                    {m.description ? `, ${m.description.slice(0, 60)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {userId && memories.length === 0 && (
            <p className="text-xs text-muted-foreground">
              This is the only response here that can become evidence. It has to point at a memory
              you sealed before you saw this symbol, and you have not sealed one yet.{' '}
              <Link to="/capture" className="underline underline-offset-2">
                Capture a memory
              </Link>
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Recording this marks a candidate match. A candidate match is not a confirmed match. A
            human reviewer decides that, and until then it stays labelled as a candidate.
          </p>
        </div>

        {SIMPLE_RESPONSES.map(({ type, label }) => {
          const row = existing(type);
          return (
            <div key={type} className="space-y-2">
              <Button
                type="button"
                variant={row ? 'default' : 'outline'}
                className="w-full justify-start rounded-full"
                disabled={!userId || busy}
                onClick={() => toggle(type)}
              >
                {row && <Check className="w-4 h-4 mr-2" />}
                {label}
              </Button>
              {type === 'contradictory_null' && (
                <p className="text-xs text-muted-foreground">
                  A report of nothing is as useful as a report of something. It is the only kind of
                  response that can weaken a pattern, so it carries the same weight here.
                </p>
              )}
            </div>
          );
        })}

        {userId && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="gap-2">
                <ChevronDown className="w-4 h-4" />
                Add a field note
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="What did you notice?"
              />
              <Button type="button" size="sm" disabled={busy || !note.trim()} onClick={handleNote}>
                Save
              </Button>
              <p className="text-xs text-muted-foreground">
                Only you and the review team can see a field note. Notes are not published.
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </section>

      {/* PART C */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">What has been recorded</h3>
        {visibleCounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing structured has been recorded against this symbol yet.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {visibleCounts.map(([key, label]) => (
              <li key={key} className="flex items-baseline gap-2">
                <span className="font-display tabular-nums">{counts[key]}</span>
                <span className="text-muted-foreground">{label}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          These counters are kept apart on purpose. Recognition, an independent prior record, a
          candidate match and a reviewed match are four different things, and only the last two are
          on the evidence track.
        </p>
      </section>
    </Card>
  );
};
