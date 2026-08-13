import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

interface Run {
  id: string;
  scraper_name: string;
  source: string | null;
  last_run_at: string;
  created_at: string;
  trials_found: number | null;
  trials_added: number | null;
  status: string;
  error_message: string | null;
}

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

const relative = (iso: string) => {
  const h = hoursSince(iso);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
  if (h < 48) return `${Math.round(h)} h ago`;
  return `${Math.round(h / 24)} d ago`;
};

export const ScraperRunHistory = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraper, setScraper] = useState("all");
  const [status, setStatus] = useState("all");
  const [coverage, setCoverage] = useState<{ total: number; enriched: number } | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data }, total, enriched] = await Promise.all([
      supabase
        .from("scraper_runs")
        .select("*")
        .order("last_run_at", { ascending: false })
        .limit(200),
      supabase.from("article_leads").select("id", { count: "exact", head: true }),
      supabase
        .from("article_leads")
        .select("id", { count: "exact", head: true })
        .not("ai_enriched_at", "is", null),
    ]);
    setRuns((data as Run[]) ?? []);
    setCoverage({ total: total.count ?? 0, enriched: enriched.count ?? 0 });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const scrapers = useMemo(
    () => Array.from(new Set(runs.map((r) => r.scraper_name))).sort(),
    [runs],
  );

  const filtered = runs.filter(
    (r) =>
      (scraper === "all" || r.scraper_name === scraper) &&
      (status === "all" || (status === "failed" ? r.status !== "success" : r.status === "success")),
  );

  // Health per scraper: latest run, staleness, failures in last 7 days.
  const health = useMemo(() => {
    return scrapers.map((name) => {
      const rows = runs.filter((r) => r.scraper_name === name);
      const latest = rows[0];
      const week = rows.filter((r) => hoursSince(r.last_run_at) <= 168);
      return {
        name,
        latest,
        failures7d: week.filter((r) => r.status !== "success").length,
        runs7d: week.length,
        stored7d: week.reduce((s, r) => s + (r.trials_added ?? 0), 0),
        seen7d: week.reduce((s, r) => s + (r.trials_found ?? 0), 0),
        stale: latest ? hoursSince(latest.last_run_at) > 48 : true,
      };
    });
  }, [runs, scrapers]);

  const failing = health.filter((h) => h.failures7d > 0 || h.stale);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Scraper run history</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Every recorded run: errors, items seen, leads stored, and enrichment coverage.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {failing.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Needs attention
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {failing.map((h) => (
                <li key={h.name}>
                  <span className="font-mono">{h.name}</span>
                  {h.failures7d > 0 && ` — ${h.failures7d} failed run${h.failures7d === 1 ? "" : "s"} in 7 days`}
                  {h.stale && h.latest && ` — no run for ${relative(h.latest.last_run_at)}`}
                  {h.stale && !h.latest && " — never run"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {health.map((h) => (
            <div key={h.name} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm">{h.name}</span>
                {h.latest?.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {h.latest ? relative(h.latest.last_run_at) : "never"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                7 days: {h.runs7d} runs, {h.seen7d} seen, {h.stored7d} stored
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="text-sm font-medium">Article lead enrichment coverage</p>
          {coverage ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {coverage.enriched} of {coverage.total} leads have auto summary and tags
              {coverage.total > 0 && ` (${Math.round((coverage.enriched / coverage.total) * 100)}%)`}.
              {coverage.total - coverage.enriched > 0 &&
                ` ${coverage.total - coverage.enriched} fill in on the next run.`}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">—</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={scraper} onValueChange={setScraper}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scrapers</SelectItem>
              {scrapers.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success only</SelectItem>
              <SelectItem value="failed">Failures only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Run</th>
                <th className="py-2 pr-3">Scraper</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right tabular-nums">Seen</th>
                <th className="py-2 pr-3 text-right tabular-nums">Stored</th>
                <th className="py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.last_run_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {r.scraper_name}
                    {r.source && r.source !== r.scraper_name && (
                      <span className="text-muted-foreground"> / {r.source}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={r.status === "success" ? "outline" : "destructive"}>{r.status}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.trials_found ?? 0}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.trials_added ?? 0}</td>
                  <td className="py-2 text-xs text-destructive">{r.error_message ?? ""}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No runs match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
