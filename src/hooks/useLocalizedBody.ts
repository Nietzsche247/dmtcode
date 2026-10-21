import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/i18n/LocaleProvider';
import { currentStaticTranslation } from '@/lib/staticTranslation';

/**
 * Returns the translated body HTML the Netlify prerender already served for
 * this page, so hydration does not overwrite it with the English JSX.
 *
 * One source of truth: content_translations (table_name='static',
 * field='body_html'). English returns null, the English JSX is the source.
 * Any error, or a missing row, also returns null so the page falls back to
 * the English block rather than rendering blank.
 */
export function useLocalizedBody(pageId: string, opts?: { requireHrefs?: string[] }): string | null {
  const locale = useLocale();
  const enabled = locale !== 'en' && Boolean(pageId);

  const { data } = useQuery({
    queryKey: ['useLocalizedBody', pageId, locale, opts?.requireHrefs],
    enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_translations')
        .select('translated_text, source_hash, locale')
        .eq('table_name', 'static')
        .eq('record_id', pageId)
        .in('locale', ['en', locale])
        .eq('field', 'body_html');

      if (error) return null;
      return currentStaticTranslation(data, locale, opts?.requireHrefs);
    },
  });

  if (!enabled) return null;
  return data ?? null;
}

export default useLocalizedBody;
