import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface VocabTerm {
  term: string;
  category: string;
  status: 'canonical' | 'candidate' | 'rejected';
}

interface ContextTermPickerProps {
  value?: string | null;
  onChange: (term: string | null) => void;
  allowCandidate?: boolean;
  className?: string;
}

/**
 * Context vocabulary picker. Reads public tag_vocabulary.
 * Canonical terms are grouped by category as chips.
 * When allowCandidate is true, an "Other" free-text input proposes a candidate row.
 * Never writes to symbol_votes or symbol_submissions.
 */
export const ContextTermPicker = ({
  value,
  onChange,
  allowCandidate = true,
  className,
}: ContextTermPickerProps) => {
  const [terms, setTerms] = useState<VocabTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherInput, setOtherInput] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('tag_vocabulary' as any)
        .select('term,category,status')
        .in('status', ['canonical'])
        .order('category', { ascending: true })
        .order('term', { ascending: true });
      if (!alive) return;
      setTerms((data as VocabTerm[]) || []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, VocabTerm[]> = {};
    for (const t of terms) {
      (g[t.category] ||= []).push(t);
    }
    return g;
  }, [terms]);

  const proposeCandidate = async () => {
    const raw = otherInput.trim().toLowerCase();
    if (!raw) return;
    if (raw.length > 40) {
      toast.error('Keep it under 40 characters');
      return;
    }
    // Insert candidate (RLS enforces status='candidate' + authenticated).
    const { error } = await supabase
      .from('tag_vocabulary' as any)
      .insert({ term: raw, category: 'other', status: 'candidate' });
    if (error && !error.message.toLowerCase().includes('duplicate')) {
      toast.error('Could not add that term');
      return;
    }
    onChange(raw);
    setOtherInput('');
    toast.success('Added as a candidate context');
  };

  if (loading) {
    return <div className={cn('text-xs text-muted-foreground', className)}>Loading contexts…</div>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{cat}</div>
          <div className="flex flex-wrap gap-1.5">
            {list.map((t) => {
              const active = value === t.term;
              return (
                <button
                  key={t.term}
                  type="button"
                  onClick={() => onChange(active ? null : t.term)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full border transition-colors min-h-[32px]',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                  )}
                >
                  {t.term}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {allowCandidate && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Other (proposes a new context)
          </div>
          <div className="flex gap-2">
            <Input
              value={otherInput}
              placeholder="e.g., dashboard, ceiling fan"
              onChange={(e) => setOtherInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), proposeCandidate())}
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={proposeCandidate}
              disabled={!otherInput.trim()}
              aria-label="Propose new context"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {value && !terms.some((t) => t.term === value) && (
            <div className="text-[11px] text-muted-foreground">
              Selected candidate: <Badge variant="outline" className="ml-1">{value}</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
