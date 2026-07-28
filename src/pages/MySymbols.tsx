import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Award, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatSealedAt } from '@/lib/sealFormat';
import { VisualFieldMap } from '@/components/registry/VisualFieldMap';

interface UserBadge {
  badge_name: string;
  earned_at: string;
  icon?: string;
  description?: string;
}

interface UserSymbol {
  id: string;
  image_url: string;
  upvotes: number;
  tags: string[] | null;
  created_at: string;
  description?: string | null;
}

interface SealedMemory {
  id: string;
  image_data: string | null;
  motif_tags: string[] | null;
  free_text_notes: string | null;
  sealed_at: string | null;
  original_record_hash: string | null;
  capture_route: string | null;
  catalog_exposure_before_submission: string | null;
  privacy_level: string | null;
  field_x: number | null;
  field_y: number | null;
  field_band: string | null;
  field_attachment: string | null;
  field_anchoring: string | null;
  field_locations: string | null;
  orientation: string | null;
  depth: string | null;
  offline_captured_at: string | null;
  created_at: string;
}

interface FollowedSymbol {
  id: string;
  description: string | null;
  image_url: string | null;
}

interface Annotation {
  id: string;
  glyph_id: string;
  body: string;
  created_at: string;
}

const PRIVACY_WORDS: Record<string, string> = {
  private: 'Only you can see this',
  anonymous_matchable: 'Visible without your name, and eligible for matching',
  public_pseudonym: 'Visible under your pseudonym',
  researcher_available: 'Visible, and available to researchers on request',
};

const FIELD_LABELS: { key: keyof SealedMemory; label: string; values: Record<string, string> }[] = [
  {
    key: 'field_band',
    label: 'Relative to the diffraction band',
    values: {
      inside_band: 'Inside the band',
      on_band: 'On the band itself',
      outside_band: 'Outside the band',
      unsure: 'Not sure',
    },
  },
  {
    key: 'depth',
    label: 'How far away did it seem',
    values: {
      near: 'Close to me',
      intermediate: 'Middle distance',
      far: 'Far away',
      unsure: 'Not sure',
    },
  },
  {
    key: 'field_attachment',
    label: 'How was it attached',
    values: {
      on_surface: 'On the surface',
      floating: 'Floating in front of the surface',
      recessed: 'Set back behind the surface',
      layered: 'Layered, more than one depth at once',
      unsure: 'Not sure',
    },
  },
  {
    key: 'field_anchoring',
    label: 'When you moved your head or eyes',
    values: {
      fixed_in_space: 'It stayed where it was',
      moved_with_me: 'It moved with me',
      unsure: 'Not sure',
    },
  },
  {
    key: 'orientation',
    label: 'Orientation',
    values: {
      upright: 'Upright',
      inverted: 'Inverted',
      rotated: 'Rotated to one side',
      no_clear_orientation: 'No clear orientation',
      unsure: 'Not sure',
    },
  },
  {
    key: 'field_locations',
    label: 'One place or many',
    values: {
      one_place: 'One place only',
      several_places: 'Several distinct places',
      everywhere: 'Across the whole field',
      unsure: 'Not sure',
    },
  },
];

const MySymbols = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userSymbols, setUserSymbols] = useState<UserSymbol[]>([]);
  const [memories, setMemories] = useState<SealedMemory[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followedSymbols, setFollowedSymbols] = useState<FollowedSymbol[]>([]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to view your symbols');
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setUserId(user.id);
    await Promise.all([
      loadUserBadges(user.id),
      loadUserSymbols(user.id),
      loadMemories(user.id),
      loadFollowedSymbols(user.id),
    ]);
    setLoading(false);
  };

  const loadFollowedSymbols = async (uid: string) => {
    const { data: follows } = await supabase
      .from('follows')
      .select('entity_id')
      .eq('user_id', uid)
      .eq('entity_type', 'symbol');

    const ids = Array.from(new Set((follows ?? []).map((f: any) => f.entity_id)));
    if (ids.length === 0) {
      setFollowedSymbols([]);
      return;
    }

    const { data } = await supabase
      .from('symbol_submissions')
      .select('id, description, image_url')
      .in('id', ids);

    setFollowedSymbols((data ?? []) as FollowedSymbol[]);
  };

  const loadUserBadges = async (uid: string) => {
    const { data } = await supabase
      .from('user_badges')
      .select('badge_name, earned_at')
      .eq('user_id', uid)
      .order('earned_at', { ascending: false });

    if (data) {
      const { data: badgeDetails } = await supabase
        .from('badges')
        .select('name, icon, description')
        .in('name', data.map(b => b.badge_name));

      setUserBadges(data.map(badge => {
        const details = badgeDetails?.find(b => b.name === badge.badge_name);
        return { ...badge, icon: details?.icon, description: details?.description };
      }));
    }
  };

  const loadUserSymbols = async (uid: string) => {
    const { data } = await supabase
      .from('symbol_submissions')
      .select('id, image_url, upvotes, tags, created_at, description')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) setUserSymbols(data as UserSymbol[]);
  };

  const loadMemories = async (uid: string) => {
    const { data } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, motif_tags, free_text_notes, sealed_at, original_record_hash, capture_route, catalog_exposure_before_submission, privacy_level, field_x, field_y, field_band, field_attachment, field_anchoring, field_locations, orientation, depth, offline_captured_at, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    const rows = (data || []) as unknown as SealedMemory[];
    setMemories(rows);

    if (rows.length > 0) {
      const { data: notes } = await supabase
        .from('glyph_annotations')
        .select('id, glyph_id, body, created_at')
        .in('glyph_id', rows.map(r => r.id))
        .order('created_at', { ascending: true });
      setAnnotations((notes || []) as Annotation[]);
    }
  };

  const saveAnnotation = async (glyphId: string) => {
    const body = (drafts[glyphId] || '').trim();
    if (!userId || !body) return;
    setSavingId(glyphId);
    const { data, error } = await supabase
      .from('glyph_annotations')
      .insert({ glyph_id: glyphId, user_id: userId, body })
      .select('id, glyph_id, body, created_at')
      .single();
    setSavingId(null);
    if (error || !data) {
      toast.error('Could not save the note');
      return;
    }
    setAnnotations(prev => [...prev, data as Annotation]);
    setDrafts(prev => ({ ...prev, [glyphId]: '' }));
  };

  const downloadData = () => {
    const payload: Record<string, unknown> = {};
    if (userBadges.length > 0) payload.badges = userBadges;
    if (userSymbols.length > 0) payload.symbols = userSymbols;
    if (memories.length > 0) payload.sealed_memories = memories;
    if (annotations.length > 0) payload.annotations = annotations;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmtcode-my-data-${Date.now()}.json`;
    a.click();
    toast.success('Downloaded your data');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your memories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Your Memory Vault | DMT Code Visual Symbol Catalogue</title>
        <meta name="description" content="Your sealed memories, annotations, submissions and badges" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />

        <main className="relative z-10 pt-20">
          <div className="block md:hidden">
            <Breadcrumb />
          </div>

          <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">Your Memory Vault</h1>

            {/* Sealed memories */}
            <section className="max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl font-bold mb-6">Your sealed memories</h2>

              {memories.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">You have not sealed a memory yet.</p>
                  <Button asChild>
                    <Link to="/capture">Capture a memory</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {memories.map(m => {
                    const notes = annotations.filter(a => a.glyph_id === m.id);
                    return (
                      <Card key={m.id} className="p-6 bg-card border-border space-y-4">
                        {typeof m.image_data === 'string' && m.image_data.length > 0 && (
                          <img
                            src={m.image_data.startsWith('data:') ? m.image_data : `data:image/png;base64,${m.image_data}`}
                            alt="A sealed memory you recorded"
                            className="w-full h-auto border border-border bg-white"
                          />
                        )}

                        <div className="space-y-1 text-sm text-muted-foreground">
                          {m.sealed_at ? (
                            <p>Sealed at {formatSealedAt(m.sealed_at)}</p>
                          ) : (
                            <p>Recorded before the sealing protocol existed, so this record carries no seal.</p>
                          )}

                          {m.original_record_hash && (
                            <p>
                              Fingerprint <span className="font-mono">{m.original_record_hash.slice(0, 12)}</span>
                            </p>
                          )}

                          {m.capture_route === 'capture_page' && <p>Recorded blind, before the catalogue.</p>}
                          {m.capture_route === 'registry_page' && (
                            <p>Recorded from the registry page, so this report is marked as catalogue exposed.</p>
                          )}

                          {m.offline_captured_at && (
                            <p>
                              You recorded this while offline. Your device reported the time as {formatSealedAt(m.offline_captured_at)}. We sealed it at {m.sealed_at ? formatSealedAt(m.sealed_at) : 'the server time recorded on sync'} when it reached us, and that server time is the one we can actually vouch for.
                            </p>
                          )}

                          {m.privacy_level && PRIVACY_WORDS[m.privacy_level] && (
                            <p>{PRIVACY_WORDS[m.privacy_level]}</p>
                          )}
                        </div>

                        {m.field_x !== null && m.field_y !== null && (
                          <div className="max-w-[260px]">
                            <VisualFieldMap value={{ x: Number(m.field_x), y: Number(m.field_y) }} readOnly />
                          </div>
                        )}

                        {FIELD_LABELS.some(f => m[f.key]) && (
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {FIELD_LABELS.map(f => {
                              const raw = m[f.key] as string | null;
                              if (!raw) return null;
                              const readable = f.values[raw];
                              if (!readable) return null;
                              return (
                                <div key={f.key as string}>
                                  <dt className="text-muted-foreground text-xs">{f.label}</dt>
                                  <dd>{readable}</dd>
                                </div>
                              );
                            })}
                          </dl>
                        )}

                        {m.motif_tags && m.motif_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {m.motif_tags.map((tag, idx) => (
                              <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}

                        {m.free_text_notes && (
                          <blockquote className="border-l-2 border-border pl-4 text-sm italic">
                            {m.free_text_notes}
                          </blockquote>
                        )}

                        {notes.length > 0 && (
                          <ul className="space-y-3">
                            {notes.map(n => (
                              <li key={n.id} className="border border-border rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {new Date(n.created_at).toLocaleDateString(undefined, {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                  })}
                                </p>
                                <p className="text-sm">{n.body}</p>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            The record above cannot be edited, by you or by us. If your memory has changed, add a note and both versions are kept.
                          </p>
                          <Textarea
                            rows={3}
                            value={drafts[m.id] || ''}
                            onChange={(e) => setDrafts(prev => ({ ...prev, [m.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            onClick={() => saveAnnotation(m.id)}
                            disabled={savingId === m.id || !(drafts[m.id] || '').trim()}
                          >
                            {savingId === m.id ? 'Saving...' : 'Save note'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Badges */}
            {userBadges.length > 0 && (
              <Card className="p-8 mb-12 bg-card border-border">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6" /> Your Badges
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userBadges.map(badge => (
                    <div key={badge.badge_name} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                      <div className="font-semibold text-sm mb-1">
                        {badge.badge_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      {badge.description && (
                        <div className="text-xs text-muted-foreground">{badge.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Catalogue submissions */}
            {userSymbols.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Your catalogue submissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userSymbols.map(symbol => (
                    <Card key={symbol.id} className="p-4 bg-card border-border">
                      <img
                        src={symbol.image_url}
                        alt={`Your symbol, ${symbol.tags?.slice(0, 2).join(', ') || 'visual symbol'}`}
                        className="w-full h-auto mb-3 border border-border object-contain bg-white"
                      />
                      <div className="text-center mb-3">
                        <p className="text-sm font-semibold">
                          {symbol.upvotes} {symbol.upvotes === 1 ? 'Confirmation' : 'Confirmations'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(symbol.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {symbol.tags && symbol.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {symbol.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {followedSymbols.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-2">Symbols you are following</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  You will be told when something changes for these, once notifications are switched on.
                </p>
                <div className="space-y-2">
                  {followedSymbols.map(sym => {
                    const desc = (sym.description ?? '').trim();
                    const label = desc ? desc.slice(0, 70) : 'Untitled symbol';
                    return (
                      <Card key={sym.id} className="p-4 bg-card border-border">
                        <Link to={`/registry/${sym.id}`} className="flex items-center gap-4 hover:underline">
                          {sym.image_url && (
                            <img
                              src={sym.image_url}
                              alt={label}
                              className="w-12 h-12 object-contain bg-white border border-border shrink-0"
                            />
                          )}
                          <span className="text-sm font-medium">{label}</span>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="flex justify-center">
              <Button onClick={downloadData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download My Data
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MySymbols;
