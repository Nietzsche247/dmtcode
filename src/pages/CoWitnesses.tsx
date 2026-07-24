import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { format } from 'date-fns';

interface Recollection {
  id: string;
  user_id: string;
  symbol_id: string;
  context_term: string | null;
  body: string;
  created_at: string;
}

interface Profile { id: string; handle: string; avatar_seed: string; }
interface Symbol { id: string; image_url: string; svg_data: string | null; }

/**
 * Common-recollection wall. Only recollections from authors with visibility='wall' render.
 * Read-only surface. No writes to symbol_votes or submission counts.
 */
export default function CoWitnesses() {
  const [items, setItems] = useState<Recollection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [symbols, setSymbols] = useState<Record<string, Symbol>>({});
  const [terms, setTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolQ, setSymbolQ] = useState('');
  const [termFilter, setTermFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      // Authors visible on the wall
      const { data: wallUsers } = await (supabase as any)
        .from('co_witness_prefs')
        .select('user_id')
        .eq('visibility', 'wall');
      const allowed = new Set<string>((wallUsers || []).map((r: any) => r.user_id));
      if (allowed.size === 0) { setLoading(false); return; }

      const { data: recs } = await (supabase as any)
        .from('co_witness_recollections')
        .select('id,user_id,symbol_id,context_term,body,created_at')
        .in('user_id', Array.from(allowed))
        .order('created_at', { ascending: false })
        .limit(200);
      const list = (recs as Recollection[]) || [];
      setItems(list);

      if (list.length) {
        const userIds = Array.from(new Set(list.map((r) => r.user_id)));
        const symIds = Array.from(new Set(list.map((r) => r.symbol_id)));
        const [{ data: profs }, { data: syms }] = await Promise.all([
          (supabase as any).from('profiles').select('id,handle,avatar_seed').in('id', userIds),
          (supabase as any).from('symbol_submissions').select('id,image_url,svg_data').in('id', symIds),
        ]);
        const pmap: Record<string, Profile> = {};
        (profs || []).forEach((p: Profile) => { pmap[p.id] = p; });
        setProfiles(pmap);
        const smap: Record<string, Symbol> = {};
        (syms || []).forEach((s: Symbol) => { smap[s.id] = s; });
        setSymbols(smap);
        setTerms(Array.from(new Set(list.map((r) => r.context_term).filter(Boolean) as string[])));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (termFilter !== 'all' && r.context_term !== termFilter) return false;
      if (symbolQ.trim()) {
        const s = symbols[r.symbol_id];
        if (!s) return false;
        if (!s.id.toLowerCase().includes(symbolQ.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [items, termFilter, symbolQ, symbols]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Co-witness wall - independent recollections of the same symbol</title>
        <meta name="description" content="Field notes from people who independently recognized the same symbol. Handles only, opt-in, no PII." />
        <link rel="canonical" href="https://dmtcode.com/co-witnesses" />
      </Helmet>
      <Navigation />
      <main className="container max-w-4xl py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-serif">Co-witness wall</h1>
          <p className="text-muted-foreground text-sm">
            Short recollections from people who marked "seen it" on a symbol. Only those who opted in to the wall appear here.
            Handles and pseudonymous avatars only.
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Filter by symbol id"
            value={symbolQ}
            onChange={(e) => setSymbolQ(e.target.value)}
            className="max-w-sm"
          />
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="All contexts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contexts</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading recollections.</p>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              The wall opens as explorers opt in. If you have recognized a symbol, your field note could be the first.
            </p>
            <Link to="/registry" className="text-sm text-primary hover:underline inline-block">
              Browse the registry
            </Link>
          </Card>
        ) : (
          <ul className="space-y-4">
            {filtered.map((r) => {
              const p = profiles[r.user_id];
              const s = symbols[r.symbol_id];
              return (
                <li key={r.id}>
                  <Card className="p-4 flex gap-4">
                    {s && (
                      <Link to={`/registry/${s.id}`} className="shrink-0">
                        {s.svg_data ? (
                          <div
                            className="w-16 h-16 border border-border bg-white"
                            dangerouslySetInnerHTML={{ __html: s.svg_data }}
                          />
                        ) : (
                          <img src={s.image_url} alt="symbol" className="w-16 h-16 border border-border object-contain bg-white" loading="lazy" />
                        )}
                      </Link>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {p && <AvatarGlyph seed={p.avatar_seed} handle={p.handle} size={24} />}
                        <span className="text-sm font-medium">@{p?.handle || 'anon'}</span>
                        {r.context_term && (
                          <Badge variant="outline" className="text-[10px]">{r.context_term.replace(/_/g, ' ')}</Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {format(new Date(r.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{r.body}</p>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
