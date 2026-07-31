import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, FileEdit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RegistryFilters } from './RegistryFilters';
import { SymbolCard } from './SymbolCard';
import { useRegistryTracking } from '@/hooks/useRegistryTracking';
import { Skeleton } from '@/components/ui/skeleton';

const RESONANCE_MIN_RESPONSES = 5;

interface SymbolSubmission {
  id: string;
  image_url: string;
  description: string | null;
  tags: string[] | null;
  upvotes: number;
  downvotes: number;
  status: 'pending' | 'approved' | 'rejected';
  source_method: string | null;
  created_at: string;
  user_id: string;
}

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export const RegistryBrowser = () => {
  const navigate = useNavigate();
  const { trackRegistryFiltered, trackRegistrySearched } = useRegistryTracking();

  const [symbols, setSymbols] = useState<SymbolSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [validationCounts, setValidationCounts] = useState<Record<string, number>>({});
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadSymbols();
  }, []);

  useEffect(() => {
    // Track filter changes
    if (sourceFilter !== 'all' || selectedTags.length > 0) {
      trackRegistryFiltered({ source: sourceFilter, tags: selectedTags });
    }
  }, [sourceFilter, selectedTags]);

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
      .select('id, image_url, description, tags, upvotes, downvotes, status, source_method, created_at, user_id')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSymbols(data as SymbolSubmission[]);
      
      // Load profiles for contributors
      const userIds = [...new Set(data.map(s => s.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
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
          .select('symbol_id')
          .in('symbol_id', symbolIds)
          .eq('vote_type', 'seen_it');
        
        if (votes) {
          const counts: Record<string, number> = {};
          votes.forEach(v => {
            counts[v.symbol_id] = (counts[v.symbol_id] || 0) + 1;
          });
          setValidationCounts(counts);
        }
      }
    }
    
    setLoading(false);
  };

  const filteredSymbols = useMemo(() => {
    let filtered = [...symbols];

    const responseTotal = (s: SymbolSubmission) =>
      (s.upvotes || 0) + (s.downvotes || 0) + (validationCounts[s.id] || 0);
    const resonanceScore = (s: SymbolSubmission) =>
      (s.upvotes || 0) + (validationCounts[s.id] || 0) - (s.downvotes || 0);

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
          (validationCounts[b.id] || 0) - (validationCounts[a.id] || 0)
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
  }, [symbols, searchQuery, sourceFilter, selectedTags, sortBy, validationCounts]);

  // One library, one list. Nothing is segregated by how a symbol entered the
  // record; the sort the reader chose is the only thing that orders it.
  const resultSegments: string[] = [];
  if (filteredSymbols.length > 0) {
    resultSegments.push(
      `${filteredSymbols.length} symbol${filteredSymbols.length === 1 ? '' : 's'}`
    );
  }

  const hasActiveFilters = sourceFilter !== 'all' || selectedTags.length > 0 || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setSelectedTags([]);
    setSortBy('newest');
  };

  const highlightTerms = searchQuery.trim() ? searchQuery.toLowerCase().split(/\s+/) : [];

  return (
    <section id="browse" className="container mx-auto px-4 py-16">
      {/* Header with CTA */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left mb-2">
            Browse Registry
          </h2>
          <p className="text-muted-foreground text-center md:text-left">
            Every symbol in the record, in one list
          </p>
        </div>
        <Button 
          size="lg"
          className="rounded-full px-8 btn-lickable border-beam group"
          onClick={() => navigate('/submit-symbol')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Contribute Your Symbol
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
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
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results count */}
      {resultSegments.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mb-6">
          Showing {resultSegments.join(' and ')}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-lg" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSymbols.map((symbol) => (
              <SymbolCard
                key={symbol.id}
                id={symbol.id}
                imageUrl={symbol.image_url}
                description={symbol.description}
                tags={symbol.tags}
                upvotes={symbol.upvotes}
                validationCount={validationCounts[symbol.id] || 0}
                status={symbol.status}
                contributor={profiles[symbol.user_id] ? {
                  id: profiles[symbol.user_id].id,
                  displayName: profiles[symbol.user_id].display_name,
                  avatarUrl: profiles[symbol.user_id].avatar_url,
                } : null}
                createdAt={symbol.created_at}
                submitterId={symbol.user_id}
                highlightTerms={highlightTerms}
              />
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
