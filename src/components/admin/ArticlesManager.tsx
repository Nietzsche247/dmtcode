import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  body_md: string;
  topic_tags: string[];
  compounds: string[];
  target_query: string | null;
  related_trials: string[];
  related_bibliography: string[];
  related_symbols: string[];
  related_protocols: string[];
  author: string;
  reviewed_by: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
  created_at: string;
};

type ArticleLead = {
  id: string;
  url: string;
  title: string;
  excerpt: string | null;
  outlet: string | null;
  author: string | null;
  published_at: string | null;
  source: string;
  topic_tags: string[];
  compounds: string[];
  relevance_score: number;
  triage_status: string | null;
  triage_reason: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  ai_summary: string | null;
  ai_tags: string[];
  ai_key_points: string[];
  ai_enriched_at: string | null;
};

type Draft = Omit<Article, "id" | "updated_at" | "created_at" | "published_at"> & {
  id?: string;
  published_at?: string | null;
};

const EMPTY_DRAFT: Draft = {
  slug: "",
  title: "",
  dek: "",
  body_md: "",
  topic_tags: [],
  compounds: [],
  target_query: "",
  related_trials: [],
  related_bibliography: [],
  related_symbols: [],
  related_protocols: [],
  author: "DMT Code Project",
  reviewed_by: "",
  is_published: false,
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const EM_DASH = "\u2014";

type PickerKind = "trials" | "bibliography" | "symbols" | "protocols";

type PickerRow = { id: string; label: string };

async function searchPicker(kind: PickerKind, q: string): Promise<PickerRow[]> {
  const term = q.trim();
  if (kind === "trials") {
    let query = supabase.from("clinical_trials").select("id, title").limit(20);
    if (term) query = query.ilike("title", `%${term}%`);
    const { data } = await query;
    return (data ?? []).map((r: any) => ({ id: r.id, label: r.title }));
  }
  if (kind === "bibliography") {
    let query = supabase.from("bibliography").select("id, title").limit(20);
    if (term) query = query.ilike("title", `%${term}%`);
    const { data } = await query;
    return (data ?? []).map((r: any) => ({ id: r.id, label: r.title }));
  }
  if (kind === "symbols") {
    let query = supabase.from("symbol_submissions").select("id, context_note").limit(20);
    if (term) query = query.ilike("id", `%${term}%`);
    const { data } = await query;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      label: `Symbol ${String(r.id).slice(0, 8)}${r.context_note ? ` - ${String(r.context_note).slice(0, 40)}` : ""}`.replace(EM_DASH, "-"),
    }));
  }
  // protocols use slug as the stored id
  let query = supabase.from("protocols").select("slug, name").limit(20);
  if (term) query = query.ilike("name", `%${term}%`);
  const { data } = await query;
  return (data ?? []).map((r: any) => ({ id: r.slug, label: r.name }));
}

async function resolveLabels(kind: PickerKind, ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const map: Record<string, string> = {};
  if (kind === "trials") {
    const { data } = await supabase.from("clinical_trials").select("id, title").in("id", ids);
    (data ?? []).forEach((r: any) => (map[r.id] = r.title));
  } else if (kind === "bibliography") {
    const { data } = await supabase.from("bibliography").select("id, title").in("id", ids);
    (data ?? []).forEach((r: any) => (map[r.id] = r.title));
  } else if (kind === "symbols") {
    const { data } = await supabase.from("symbol_submissions").select("id").in("id", ids);
    (data ?? []).forEach((r: any) => (map[r.id] = `Symbol ${String(r.id).slice(0, 8)}`));
  } else {
    const { data } = await supabase.from("protocols").select("slug, name").in("slug", ids);
    (data ?? []).forEach((r: any) => (map[r.slug] = r.name));
  }
  return map;
}

function RelatedPicker({
  kind,
  label,
  ids,
  onChange,
}: {
  kind: PickerKind;
  label: string;
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickerRow[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    resolveLabels(kind, ids).then(setLabels);
  }, [ids, kind]);

  useEffect(() => {
    if (!open) return;
    const h = setTimeout(() => {
      searchPicker(kind, q).then(setResults);
    }, 200);
    return () => clearTimeout(h);
  }, [q, open, kind]);

  const add = (id: string, lab: string) => {
    if (ids.includes(id)) return;
    onChange([...ids, id]);
    setLabels((m) => ({ ...m, [id]: lab }));
  };
  const remove = (id: string) => onChange(ids.filter((x) => x !== id));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => (
          <Badge key={id} variant="secondary" className="gap-1">
            {labels[id] ?? id.slice(0, 8)}
            <button type="button" onClick={() => remove(id)} aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {ids.length === 0 && (
          <span className="text-xs text-muted-foreground">None selected</span>
        )}
      </div>
      <div className="relative">
        <Input
          value={q}
          placeholder={`Search ${label.toLowerCase()}...`}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {open && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-popover shadow">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  add(r.id, r.label);
                  setQ("");
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TokenInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const add = () => {
    const v = q.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setQ("");
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Add ${label.toLowerCase()} and press Enter`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

export const ArticlesManager = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [leads, setLeads] = useState<ArticleLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [publishingLeadId, setPublishingLeadId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [articlesRes, leadsRes] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase
        .from("article_leads")
        .select("*")
        .eq("is_approved", false)
        .order("relevance_score", { ascending: false })
        .limit(50),
    ]);
    if (articlesRes.error) {
      toast.error(articlesRes.error.message);
    } else {
      setArticles((articlesRes.data ?? []) as Article[]);
    }
    if (leadsRes.error) {
      toast.error(leadsRes.error.message);
    } else {
      setLeads((leadsRes.data ?? []) as ArticleLead[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const existingSlugs = useMemo(
    () => new Set(articles.filter((a) => a.id !== draft.id).map((a) => a.slug)),
    [articles, draft.id],
  );

  const openNew = () => {
    setDraft(EMPTY_DRAFT);
    setSlugTouched(false);
    setPublishingLeadId(null);
    setEditorOpen(true);
  };

  const openEdit = (a: Article) => {
    setDraft({
      id: a.id,
      slug: a.slug,
      title: a.title,
      dek: a.dek,
      body_md: a.body_md,
      topic_tags: a.topic_tags ?? [],
      compounds: a.compounds ?? [],
      target_query: a.target_query ?? "",
      related_trials: a.related_trials ?? [],
      related_bibliography: a.related_bibliography ?? [],
      related_symbols: a.related_symbols ?? [],
      related_protocols: a.related_protocols ?? [],
      author: a.author,
      reviewed_by: a.reviewed_by ?? "",
      is_published: a.is_published,
      published_at: a.published_at,
    });
    setSlugTouched(true);
    setPublishingLeadId(null);
    setEditorOpen(true);
  };

  const openPublishFromLead = (lead: ArticleLead) => {
    const body = lead.ai_summary || lead.excerpt || "";
    setDraft({
      ...EMPTY_DRAFT,
      slug: slugify(lead.title),
      title: lead.title,
      dek: lead.ai_summary && lead.ai_summary.length <= 400
        ? lead.ai_summary
        : (lead.excerpt || "").slice(0, 400),
      body_md: body,
      topic_tags: (lead.ai_tags?.length ? lead.ai_tags : lead.topic_tags) ?? [],
      compounds: lead.compounds ?? [],
      target_query: lead.url,
      author: lead.author || "DMT Code Project",
      is_published: true,
    });
    setSlugTouched(false);
    setPublishingLeadId(lead.id);
    setEditorOpen(true);
  };

  const remove = async (a: Article) => {
    if (!confirm(`Delete article "${a.title}"?`)) return;
    const { error } = await supabase.from("articles").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Article deleted.");
    load();
  };

  const togglePublish = async (a: Article) => {
    const patch: any = { is_published: !a.is_published };
    if (!a.is_published && !a.published_at) {
      patch.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("articles").update(patch).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(a.is_published ? "Unpublished." : "Published.");
    load();
  };

  const onTitleChange = (v: string) => {
    setDraft((d) => {
      const next = { ...d, title: v };
      if (!slugTouched) next.slug = slugify(v);
      return next;
    });
  };

  const validate = (): { ok: boolean; warn?: string } => {
    if (
      draft.title.includes(EM_DASH) ||
      draft.dek.includes(EM_DASH) ||
      draft.body_md.includes(EM_DASH)
    ) {
      toast.error(
        "Em dashes are not allowed in public copy. Use a comma, colon or full stop.",
      );
      return { ok: false };
    }
    if (!draft.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
      toast.error("Slug must be lowercase, hyphenated, alphanumeric only.");
      return { ok: false };
    }
    if (existingSlugs.has(draft.slug)) {
      toast.error("Slug collision: another article already uses this slug.");
      return { ok: false };
    }
    if (!draft.title.trim() || !draft.dek.trim() || !draft.body_md.trim()) {
      toast.error("Title, dek and body are required.");
      return { ok: false };
    }
    const hasRelated =
      draft.related_trials.length +
        draft.related_bibliography.length +
        draft.related_symbols.length +
        draft.related_protocols.length >
      0;
    const hasExternalLink = /https?:\/\//i.test(draft.body_md);
    const hasNumberOrPct = /\b\d{3,}\b|\d+\s?%/.test(draft.body_md);
    if (hasNumberOrPct && !hasRelated && !hasExternalLink) {
      return {
        ok: true,
        warn:
          "This article contains figures but cites no records. Every number should trace to a record or a source.",
      };
    }
    return { ok: true };
  };

  const save = async () => {
    const v = validate();
    if (!v.ok) return;
    if (v.warn && !confirm(`${v.warn}\n\nSave anyway?`)) return;

    // Warn on slug change after publish
    if (draft.id) {
      const original = articles.find((a) => a.id === draft.id);
      if (
        original &&
        original.is_published &&
        original.slug !== draft.slug &&
        !confirm(
          "This article is already published. Changing the slug will break any external links. Continue?",
        )
      )
        return;
    }

    setSaving(true);
    const payload: any = {
      slug: draft.slug,
      title: draft.title,
      dek: draft.dek,
      body_md: draft.body_md,
      topic_tags: draft.topic_tags,
      compounds: draft.compounds,
      target_query: draft.target_query || null,
      related_trials: draft.related_trials,
      related_bibliography: draft.related_bibliography,
      related_symbols: draft.related_symbols,
      related_protocols: draft.related_protocols,
      author: draft.author || "DMT Code Project",
      reviewed_by: draft.reviewed_by || null,
      is_published: draft.is_published,
    };

    if (draft.id) {
      const original = articles.find((a) => a.id === draft.id);
      if (draft.is_published && original && !original.is_published && !original.published_at) {
        payload.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("articles").update(payload).eq("id", draft.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Article saved.");
    } else {
      if (draft.is_published) payload.published_at = new Date().toISOString();
      const { error } = await supabase.from("articles").insert(payload);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Article created.");
    }
    setEditorOpen(false);
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Articles</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Long-form written pieces. Authors, publish state, and slug are managed here.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New article
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading.</p>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground">No articles yet.</p>
        ) : (
          <div className="space-y-2">
            {articles.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 border border-border rounded-md p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{a.title || "(untitled)"}</span>
                    <Badge variant={a.is_published ? "default" : "outline"}>
                      {a.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">/articles/{a.slug}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>
                    {a.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="gap-1">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(a)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit article" : "New article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setDraft({ ...draft, slug: slugify(e.target.value) });
                  }}
                />
                {existingSlugs.has(draft.slug) && (
                  <p className="text-xs text-destructive">Slug already in use.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dek">Dek (liftable answer, one or two sentences)</Label>
              <Textarea
                id="dek"
                rows={2}
                value={draft.dek}
                onChange={(e) => setDraft({ ...draft, dek: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body (Markdown)</Label>
              <Textarea
                id="body"
                rows={18}
                className="font-mono text-sm"
                value={draft.body_md}
                onChange={(e) => setDraft({ ...draft, body_md: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <TokenInput
                label="Topic tags"
                values={draft.topic_tags}
                onChange={(v) => setDraft({ ...draft, topic_tags: v })}
              />
              <TokenInput
                label="Compounds"
                values={draft.compounds}
                onChange={(v) => setDraft({ ...draft, compounds: v })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tq">Target query (optional)</Label>
              <Input
                id="tq"
                value={draft.target_query ?? ""}
                onChange={(e) => setDraft({ ...draft, target_query: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <RelatedPicker
                kind="trials"
                label="Related trials"
                ids={draft.related_trials}
                onChange={(v) => setDraft({ ...draft, related_trials: v })}
              />
              <RelatedPicker
                kind="bibliography"
                label="Related bibliography"
                ids={draft.related_bibliography}
                onChange={(v) => setDraft({ ...draft, related_bibliography: v })}
              />
              <RelatedPicker
                kind="symbols"
                label="Related symbols"
                ids={draft.related_symbols}
                onChange={(v) => setDraft({ ...draft, related_symbols: v })}
              />
              <RelatedPicker
                kind="protocols"
                label="Related protocols"
                ids={draft.related_protocols}
                onChange={(v) => setDraft({ ...draft, related_protocols: v })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewed">Reviewed by (optional)</Label>
                <Input
                  id="reviewed"
                  value={draft.reviewed_by ?? ""}
                  onChange={(e) => setDraft({ ...draft, reviewed_by: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="pub"
                checked={draft.is_published}
                onCheckedChange={(v) => setDraft({ ...draft, is_published: v })}
              />
              <Label htmlFor="pub">Published</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
