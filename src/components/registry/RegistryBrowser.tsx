import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, FileEdit } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RegistryFilters } from './RegistryFilters';
import { SymbolCard } from './SymbolCard';
import { useRegistryTracking } from '@/hooks/useRegistryTracking';
import { Skeleton } from '@/components/ui/skeleton';
import { RegistryDoor } from './RegistryDoor';

const RESONANCE_MIN_RESPONSES = 5;

const CC_LINE = 'DMT Code registry export. Licensed CC-BY-4.0. Attribution: DMT Code (dmtcode.com).';

// Tag vocabulary used to surface null reports and sober-baseline records.
// There is no null_report and no sober/condition column on symbol_submissions
// today, so these are derived from the existing tags array rather than from a
// new column. Records matching them are shown in the same list as everything
// else, never hidden by default, and carry a visible tag.
const NULL_REPORT_TAGS = ['null-report', 'null_report', 'nothing-seen', 'no-forms'];
const SOBER_TAGS = ['sober', 'sober-baseline', 'sober_baseline', 'no-substance'];

const hasAnyTag = (tags: string[] | null, vocab: string[]) =>
  (tags || []).some((t) => vocab.includes(t.toLowerCase().trim()));

interface SymbolSubmission {
  id: string;
  image_url: string;
  description: string | null;
  tags: string[] | null;
  upvotes: number;
  downvotes: number;
  status: 'pending' | 'approved' | 'rejected';
  source_method: string | null;
  dose_level: string | null;
  wavelength: string | null;
  created_at: string;
  user_id: string;
  is_sober_baseline: boolean | null;
}

interface ProfileData {
  id: string;
  handle: string | null;
  avatar_seed: string | null;
}

export const RegistryBrowser = () => {
  const navigate = useNavigate();
  const { trackRegistryFiltered, trackRegistrySearched } = useRegistryTracking();
  const [searchParams, setSearchParams] = useSearchParams();

  const [symbols, setSymbols] = useState<SymbolSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [recognitionCounts, setRecognitionCounts] = useState<Record<string, number>>({});
  const [similarCounts, setSimilarCounts] = useState<Record<string, number>>({});
  const [communityTagsMap, setCommunityTagsMap] = useState<Record<string, { name: string; count: number }[]>>({});

  // Filters are query-string driven so a counter elsewhere on the site can link
  // to exactly the rows that make up its number.
  const searchQuery = searchParams.get('q') || '';
  const sourceFilter = searchParams.get('source') || 'all';
  const doseFilter = searchParams.get('dose') || 'all';
  const recordFilter = searchParams.get('record') || 'all';
  const selectedTags = (searchParams.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean);
  const sortBy = searchParams.get('sort') || 'newest';

  const setParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === defaultValue) next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setSearchQuery = (v: string) => setParam('q', v, '');
  const setSourceFilter = (v: string) => setParam('source', v, 'all');
  const setDoseFilter = (v: string) => setParam('dose', v, 'all');
  const setRecordFilter = (v: string) => setParam('record', v, 'all');
  const setSelectedTags = (v: string[]) => setParam('tags', v.join(','), '');
  const setSortBy = (v: string) => setParam('sort', v, 'newest');

  useEffect(() => {
    loadSymbols();
  }, []);

  useEffect(() => {
    // Track filter changes
    if (sourceFilter !== 'all' || selectedTags.length > 0) {
      trackRegistryFiltered({ source: sourceFilter, tags: selectedTags });
    }
  }, [sourceFilter, selectedTags.join(',')]);

  useEffect(() => {
    // Track search
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        trackRegistrySearched(searchQuery, filteredSymbols.length);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);


  const loadSymbols = async () => {
    setLoading(true);
    
    // Load approved submissions
    const { data, error } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, description, tags, upvotes, downvotes, status, source_method, dose_level, wavelength, created_at, user_id, is_sober_baseline')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSymbols(data as SymbolSubmission[]);
      
      // Load profiles for contributors. Approved rows can have a null
      // user_id (anonymous submissions), so filter those out before the
      // .in() call: a literal "null" in a uuid in-list makes Postgres 400.
      const userIds = [...new Set(data.map(s => s.user_id))].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      );
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, handle, avatar_seed')
          .in('id', userIds);
        
        if (profileData) {
          const profileMap: Record<string, ProfileData> = {};
          profileData.forEach(p => { profileMap[p.id] = p; });
          setProfiles(profileMap);
        }
      }
      
      // Load validation counts
      const symbolIds = data.map(s => s.id);
      if (symbolIds.length > 0) {
        const { data: votes } = await supabase
          .from('symbol_votes')
          .select('symbol_id, vote_type')
          .in('symbol_id', symbolIds);

        if (votes) {
          const counts: Record<string, number> = {};
          const similar: Record<string, number> = {};
          votes.forEach(v => {
            if (v.vote_type === 'seen_it') {
              counts[v.symbol_id] = (counts[v.symbol_id] || 0) + 1;
            } else if ((v.vote_type as string) === 'similar') {
              similar[v.symbol_id] = (similar[v.symbol_id] || 0) + 1;
            }
          });
          setRecognitionCounts(counts);
          setSimilarCounts(similar);
        }

        const { data: tagRows } = await supabase
          .from('symbol_tags')
          .select('symbol_id, tag_name, upvotes')
          .in('symbol_id', symbolIds);

        if (tagRows) {
          const grouped: Record<string, { name: string; count: number }[]> = {};
          tagRows.forEach(t => {
            if (!t.symbol_id) return;
            (grouped[t.symbol_id] ||= []).push({ name: t.tag_name, count: t.upvotes || 0 });
          });
          Object.keys(grouped).forEach(k => {
            grouped[k] = grouped[k].sort((a, b) => b.count - a.count).slice(0, 5);
          });
          setCommunityTagsMap(grouped);
        }
      }
    }
    
    setLoading(false);
  };

  const filteredSymbols = useMemo(() => {
    let filtered = [...symbols];

    const responseTotal = (s: SymbolSubmission) =>
      (s.upvotes || 0) + (s.downvotes || 0) + (recognitionCounts[s.id] || 0);
    const resonanceScore = (s: SymbolSubmission) =>
      (s.upvotes || 0) + (recognitionCounts[s.id] || 0) - (s.downvotes || 0);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.description?.toLowerCase().includes(query) ||
        s.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(s => s.source_method === sourceFilter);
    }

    // Dose level filter (real column: dose_level)
    if (doseFilter !== 'all') {
      filtered = filtered.filter(s =>
        doseFilter === 'unreported' ? !s.dose_level : s.dose_level === doseFilter
      );
    }

    // Record type: null reports and sober-baseline records, derived from tags.
    // They are never hidden by default; this only narrows to them.
    if (recordFilter === 'null_report') {
      filtered = filtered.filter(s => hasAnyTag(s.tags, NULL_REPORT_TAGS));
    } else if (recordFilter === 'sober') {
      filtered = filtered.filter(s => hasAnyTag(s.tags, SOBER_TAGS));
    } else if (recordFilter === 'sober_baseline_declared') {
      filtered = filtered.filter(s => s.is_sober_baseline === true);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(s => 
        s.tags?.some(tag => 
          selectedTags.some(selectedTag => 
            tag.toLowerCase().includes(selectedTag.toLowerCase())
          )
        )
      );
    }


    // Sorting
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most_upvoted':
        filtered.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'most_validated':
        filtered.sort((a, b) => 
          (recognitionCounts[b.id] || 0) - (recognitionCounts[a.id] || 0)
        );
        break;
      case 'most_responses':
        filtered.sort((a, b) => responseTotal(b) - responseTotal(a));
        break;
      case 'resonance': {
        // Only symbols with enough responses to mean anything get ranked.
        // Everything else keeps newest-first order and follows after them.
        const ranked = filtered
          .filter((s) => responseTotal(s) >= RESONANCE_MIN_RESPONSES)
          .sort((a, b) => resonanceScore(b) - resonanceScore(a));
        const unranked = filtered
          .filter((s) => responseTotal(s) < RESONANCE_MIN_RESPONSES)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        filtered = [...ranked, ...unranked];
        break;
      }
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    // The sort the reader chose is the only thing that orders this list. There
    // is no second pass. A symbol that one person says did not match what they
    // saw keeps its place, because a rare form only a few people recognize is
    // exactly the kind of thing this registry exists to find.
    return filtered;
  }, [symbols, searchQuery, sourceFilter, doseFilter, recordFilter, selectedTags.join(','), sortBy, recognitionCounts]);

  // Count for the sober-baseline chip. Contributor declared, not verified.
  const soberBaselineCount = useMemo(
    () => symbols.filter((s) => s.is_sober_baseline === true).length,
    [symbols]
  );

  // One library, one list. Nothing is segregated by how a symbol entered the
  // record; the sort the reader chose is the only thing that orders it.
  const resultSegments: string[] = [];
  if (filteredSymbols.length > 0) {
    resultSegments.push(
      `${filteredSymbols.length} symbol${filteredSymbols.length === 1 ? '' : 's'}`
    );
  }

  const hasActiveFilters =
    sourceFilter !== 'all' ||
    doseFilter !== 'all' ||
    recordFilter !== 'all' ||
    selectedTags.length > 0 ||
    searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Export exactly the rows currently on screen, from the already-loaded data.
  const exportRows = () =>
    filteredSymbols.map((s) => ({
      id: s.id,
      created_at: s.created_at,
      contributor_handle: profiles[s.user_id]?.handle || '',
      description: s.description || '',
      tags: (s.tags || []).join('|'),
      source_method: s.source_method || '',
      dose_level: s.dose_level || '',
      wavelength: s.wavelength || '',
      recognitions_after_exposure: recognitionCounts[s.id] || 0,
      similar_responses: similarCounts[s.id] || 0,
      upvotes: s.upvotes || 0,
      downvotes: s.downvotes || 0,
      null_report: hasAnyTag(s.tags, NULL_REPORT_TAGS),
      sober_baseline: hasAnyTag(s.tags, SOBER_TAGS),
      is_sober_baseline: s.is_sober_baseline === true,
      url: `https://dmtcode.com/symbol/${s.id}`,
    }));

  const download = (contents: string, mime: string, filename: string) => {
    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = exportRows();
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(',')).join('\n');
    const filterLine = `# filters: ${searchParams.toString() || 'none'}`;
    download(
      `# ${CC_LINE}\n${filterLine}\n${headers.join(',')}\n${body}\n`,
      'text/csv;charset=utf-8',
      'dmtcode-registry-export.csv'
    );
  };

  const exportJson = () => {
    download(
      JSON.stringify(
        {
          license: 'CC-BY-4.0',
          attribution: CC_LINE,
          exported_at: new Date().toISOString(),
          filters: Object.fromEntries(searchParams.entries()),
          row_count: filteredSymbols.length,
          rows: exportRows(),
        },
        null,
        2
      ),
      'application/json',
      'dmtcode-registry-export.json'
    );
  };

  const highlightTerms = searchQuery.trim() ? searchQuery.toLowerCase().split(/\s+/) : [];


  return (
    <section id="browse" className="container mx-auto px-4 py-16">
      {/* Limitations note: always visible, above the grid. */}
      <div className="mb-12 rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          What this registry can and cannot show
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground max-w-[65ch]">
          <p>
            This is a screening collection, not a controlled experiment. Anyone can browse it before contributing, entries are self selected, and there is no randomization, no blinding, and no control over dose, setting, wavelength, or who chooses to take part. Seeing other people's symbols before recording your own can shape what you report. That effect is not ruled out here and it cannot be ruled out by a collection built this way.
          </p>
          <p>
            What a collection like this can do is tell us whether there is any hint of agreement worth digging into further, and whether it is convincing enough to bring institutions in to investigate properly. That is the whole claim. Nothing here settles the question.
          </p>
          <p>
            A separate blinded study is the channel that could settle it. It is designed and has not been run.
          </p>
          <p>
            Reports of seeing nothing are wanted and counted. They are published on the{' '}
            <a href="/null-reports" className="underline hover:text-foreground">null reports dashboard</a>
            {' '}alongside the positive ones.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left mb-2">
          Browse Registry
        </h2>
        <p className="text-muted-foreground text-center md:text-left">
          Every symbol in the record, in one list
        </p>
      </div>

      {/* Segmentation door stays above the always-visible registry content. */}
      <RegistryDoor />

      {/* Citable PDF. Static asset, so a plain anchor with the raw path: it is
          served from /downloads on every locale, no locale prefix. */}
      <div className="mb-8 rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          The symbol set as a citable PDF
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Every public record in this registry, with drawings, identifiers, contributor handles and
          recognition counts. Version 1.0, 51 records, CC BY 4.0.
        </p>
        <a
          href="/downloads/dmt-laser-code-symbols.pdf"
          className="text-sm font-medium text-gold hover:underline"
        >
          Download the PDF
        </a>
        <p className="mt-2 text-xs text-muted-foreground">DOI 10.5281/zenodo.22101522</p>
      </div>

      {/* Credibility Legend */}
      <div className="mb-8 border-t border-border pt-4">
        <p className="max-w-[65ch] text-xs leading-relaxed text-muted-foreground">
          This list is ordered by the sort you choose and by nothing else. Marking a symbol as not
          resembling what you saw is recorded as data, and it never pushes that symbol down the list
          for anyone else. Community resonance is the one ordering that weighs responses, and it
          ranks only symbols carrying at least {RESONANCE_MIN_RESPONSES} responses.
        </p>
      </div>


      {/* Filters */}
      <RegistryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        doseFilter={doseFilter}
        onDoseChange={setDoseFilter}
        recordFilter={recordFilter}
        onRecordChange={setRecordFilter}
        soberBaselineCount={soberBaselineCount}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Export */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground max-w-[52ch]">
          Export what you see: {filteredSymbols.length} row{filteredSymbols.length === 1 ? '' : 's'} exactly as
          filtered. Files carry a CC-BY-4.0 line and the filter string used.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={exportCsv} disabled={loading || filteredSymbols.length === 0}>
            CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={exportJson} disabled={loading || filteredSymbols.length === 0}>
            JSON
          </Button>
        </div>
      </div>


      {/* Results count */}
      {resultSegments.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mb-6">
          Showing {resultSegments.join(' and ')}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[260px] rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state - inviting pioneer message */}
      {!loading && filteredSymbols.length === 0 && !hasActiveFilters && (
        <div className="text-center py-20 px-4">
          <div className="max-w-md mx-auto">
            <FileEdit className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" strokeWidth={1.5} />
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Be a Pioneer</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              No symbols have been submitted yet. You could be the first to document what you've seen.
            </p>
            <Button 
              size="lg"
              className="rounded-full px-8 btn-lickable border-beam group mb-4"
              onClick={() => navigate('/submit-symbol')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Submit Your Symbol
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* Filter empty state */}
      {!loading && filteredSymbols.length === 0 && hasActiveFilters && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            No symbols match your filters. Try adjusting your selection.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Symbol library */}
      {!loading && filteredSymbols.length > 0 && (
        <div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">Symbols</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-3xl leading-relaxed">
            Forms submitted by people reporting what they saw. Each one publishes the moment it is
            submitted. Publication here is not review and it is not approval.
          </p>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredSymbols.map((symbol) => (
              <SymbolCard
                key={symbol.id}
                id={symbol.id}
                imageUrl={symbol.image_url}
                description={symbol.description}
                tags={symbol.tags}
                upvotes={symbol.upvotes}
                recognitionCount={recognitionCounts[symbol.id] || 0}
                status={symbol.status}
                contributor={profiles[symbol.user_id] ? {
                  id: profiles[symbol.user_id].id,
                  handle: profiles[symbol.user_id].handle || 'Explorer',
                  avatarSeed: profiles[symbol.user_id].avatar_seed,
                } : null}
                createdAt={symbol.created_at}
                submitterId={symbol.user_id}
                highlightTerms={highlightTerms}
                similarCount={similarCounts[symbol.id] || 0}
                communityTags={communityTagsMap[symbol.id] || []}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
