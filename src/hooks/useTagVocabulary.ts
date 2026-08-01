import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VocabularyEntry {
  tag: string;
  count: number;
}

/**
 * Site-wide tag vocabulary with usage counts, merged from the two places tags live:
 * the tags array on approved symbol_submissions, and community symbol_tags rows.
 * Fetched once per mount; the corpus is small enough for client-side filtering.
 */
export const useTagVocabulary = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const counts = new Map<string, number>();

      const [{ data: submissions }, { data: communityTags }] = await Promise.all([
        supabase.from('symbol_submissions').select('tags').eq('status', 'approved'),
        supabase.from('symbol_tags').select('tag_name, symbol_id'),
      ]);

      for (const row of submissions || []) {
        for (const tag of (row as { tags: string[] | null }).tags || []) {
          if (!tag) continue;
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }

      // Dedupe per symbol so one symbol contributes at most 1 to a given tag.
      const seen = new Set<string>();
      for (const row of (communityTags || []) as { tag_name: string; symbol_id: string | null }[]) {
        if (!row.tag_name) continue;
        const key = `${row.symbol_id ?? 'none'}::${row.tag_name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        counts.set(row.tag_name, (counts.get(row.tag_name) || 0) + 1);
      }

      if (!active) return;
      setVocabulary(
        Array.from(counts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count),
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return { vocabulary, loading };
};
