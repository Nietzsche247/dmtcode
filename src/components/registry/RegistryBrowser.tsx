import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RegistryFilters } from './RegistryFilters';
import { SymbolCard } from './SymbolCard';
import { useRegistryTracking } from '@/hooks/useRegistryTracking';
import { Skeleton } from '@/components/ui/skeleton';

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
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [symbols, searchQuery, sourceFilter, selectedTags, sortBy, validationCounts]);

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
            Community-submitted symbols with voting and validation
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
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">👍 <span className="text-xs">Seen this</span></span>
          <span className="flex items-center gap-1.5">👎 <span className="text-xs">Did not see</span></span>
          <span className="flex items-center gap-1.5">✅ <span className="text-xs">Multiple confirmations</span></span>
          <span className="flex items-center gap-1.5">⭐ <span className="text-xs">High consistency</span></span>
        </div>
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
      <div className="text-center text-sm text-muted-foreground mb-6">
        Showing {filteredSymbols.length} of {symbols.length} symbols
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredSymbols.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'No symbols match your filters. Try adjusting your selection.'
              : 'No approved symbols yet. Be the first to contribute!'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => navigate('/submit-symbol')}>
              <Plus className="w-4 h-4 mr-2" />
              Submit a Symbol
            </Button>
          )}
        </div>
      )}

      {/* Symbol Grid */}
      {!loading && filteredSymbols.length > 0 && (
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
      )}
    </section>
  );
};
