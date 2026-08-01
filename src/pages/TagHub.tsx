import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { SymbolCard } from '@/components/registry/SymbolCard';

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

const SELECT =
  'id, image_url, description, tags, upvotes, downvotes, status, source_method, created_at, user_id';

const TagHub = () => {
  const { tag: rawTag } = useParams<{ tag: string }>();
  const tag = decodeURIComponent(rawTag || '');

  const [symbols, setSymbols] = useState<SymbolSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [validationCounts, setValidationCounts] = useState<Record<string, number>>({});
  const [similarCounts, setSimilarCounts] = useState<Record<string, number>>({});
  const [communityTagsMap, setCommunityTagsMap] = useState<Record<string, { name: string; count: number }[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tag) loadSymbols(tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag]);

  const loadSymbols = async (t: string) => {
    setLoading(true);

    // Symbols carrying the tag on the submission row
    const { data: byColumn } = await supabase
      .from('symbol_submissions')
      .select(SELECT)
      .eq('status', 'approved')
      .contains('tags', [t])
      .order('created_at', { ascending: false });

    // Symbols carrying the tag as a community tag
    const { data: taggedRows } = await supabase
      .from('symbol_tags')
      .select('symbol_id')
      .eq('tag_name', t);

    const base = (byColumn || []) as SymbolSubmission[];
    const baseIds = new Set(base.map(s => s.id));
    const extraIds = [...new Set((taggedRows || [])
      .map(r => r.symbol_id as string | null)
      .filter((sid): sid is string => Boolean(sid) && !baseIds.has(sid as string)))];

    let extra: SymbolSubmission[] = [];
    if (extraIds.length > 0) {
      const { data: extraRows } = await supabase
        .from('symbol_submissions')
        .select(SELECT)
        .eq('status', 'approved')
        .in('id', extraIds);
      extra = (extraRows || []) as SymbolSubmission[];
    }

    const merged = [...base, ...extra].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setSymbols(merged);

    const symbolIds = merged.map(s => s.id);

    const userIds = [...new Set(merged.map(s => s.user_id))].filter(Boolean);
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
        setValidationCounts(counts);
        setSimilarCounts(similar);
      }

      const { data: tagRows } = await supabase
        .from('symbol_tags')
        .select('symbol_id, tag_name, upvotes')
        .in('symbol_id', symbolIds);

      if (tagRows) {
        const grouped: Record<string, { name: string; count: number }[]> = {};
        tagRows.forEach(r => {
          if (!r.symbol_id) return;
          (grouped[r.symbol_id] ||= []).push({ name: r.tag_name, count: r.upvotes || 0 });
        });
        Object.keys(grouped).forEach(k => {
          grouped[k] = grouped[k].sort((a, b) => b.count - a.count).slice(0, 5);
        });
        setCommunityTagsMap(grouped);
      }
    }

    setLoading(false);
  };

  const count = symbols.length;
  const canonical = `https://dmtcode.com/registry/tag/${encodeURIComponent(tag)}`;
  const metaDesc = `Visual symbols in the DMT Code open registry tagged "${tag}". ${count} records with community recognition counts.`;

  return (
    <>
      <Helmet>
        <title>{`Symbols tagged ${tag} — DMT Code Registry`}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        {count < 2 && <meta name="robots" content="noindex, follow" />}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Symbols tagged ${tag} — DMT Code Registry`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />

        <main className="relative z-10 pt-20 pb-16">
          <div className="container mx-auto px-4">
            <header className="mb-8 max-w-[65ch]">
              <h1 className="text-2xl font-bold mb-2">Symbols tagged "{tag}"</h1>
              <p className="text-muted-foreground">
                {count} record{count === 1 ? '' : 's'} in the open registry carry this tag.
              </p>
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                Tags are added by submitters and by readers after publication. A shared tag is a
                starting point for comparison, not evidence of a shared source.
              </p>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-[260px] rounded-lg" />
                ))}
              </div>
            ) : count === 0 ? (
              <div className="text-muted-foreground">
                <p className="mb-2">No approved records carry this tag yet.</p>
                <Link to="/registry" className="underline underline-offset-4">
                  Back to the registry
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {symbols.map((symbol) => (
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
                    similarCount={similarCounts[symbol.id] || 0}
                    communityTags={communityTagsMap[symbol.id] || []}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TagHub;
