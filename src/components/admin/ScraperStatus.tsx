import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, CheckCircle, XCircle, Clock, Mail, ExternalLink, Database, BookOpen, Zap, Mountain, Leaf, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ScraperRun {
  id: string;
  scraper_name: string;
  last_run_at: string;
  trials_found: number;
  trials_added: number;
  status: string;
  error_message: string | null;
  email_sent?: boolean;
  new_trials_count?: number;
  source?: string;
}

interface MarketScraperResult {
  source: string;
  event: string;
  status: string;
  error?: string;
  median?: string;
  probability?: string;
  forecasters?: number;
  volume?: number;
  slug?: string;
}

const SOURCE_BADGES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  clinicaltrials_gov: { label: "ClinicalTrials.gov", icon: <Database className="w-3 h-3" />, color: "bg-blue-500" },
  pubmed: { label: "PubMed", icon: <BookOpen className="w-3 h-3" />, color: "bg-purple-500" },
  psychedelic_alpha: { label: "Psychedelic Alpha", icon: <Zap className="w-3 h-3" />, color: "bg-amber-500" },
  erowid: { label: "Erowid", icon: <Leaf className="w-3 h-3" />, color: "bg-green-500" },
  retreat_guru: { label: "Retreat Guru", icon: <Mountain className="w-3 h-3" />, color: "bg-teal-500" },
  all: { label: "All Sources", icon: <RefreshCw className="w-3 h-3" />, color: "bg-primary" },
};

export const ScraperStatus = () => {
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningLegacy, setRunningLegacy] = useState(false);
  const [runningFirehose, setRunningFirehose] = useState(false);
  const [runningMarkets, setRunningMarkets] = useState(false);
  const [marketResults, setMarketResults] = useState<MarketScraperResult[] | null>(null);
  const [lastMarketScrape, setLastMarketScrape] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns();
    fetchLastMarketScrape();
  }, []);

  const fetchLastMarketScrape = async () => {
    const { data } = await supabase
      .from("market_predictions")
      .select("last_scraped")
      .order("last_scraped", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data?.last_scraped) {
      setLastMarketScrape(data.last_scraped);
    }
  };

  const fetchRuns = async () => {
    const { data, error } = await supabase
      .from("scraper_runs")
      .select("*")
      .order("last_run_at", { ascending: false })
      .limit(15);

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching scraper status:", error);
    } else if (data) {
      setRuns(data);
    }
    setLoading(false);
  };

  const triggerMarketScraper = async () => {
    setRunningMarkets(true);
    setMarketResults(null);
    toast.info("Fetching market predictions from Metaculus & Polymarket...");

    try {
      const { data, error } = await supabase.functions.invoke("scrape-markets");

      if (error) throw error;
      
      setMarketResults(data.results || []);
      setLastMarketScrape(data.timestamp);
      
      const successCount = data.results?.filter((r: MarketScraperResult) => r.status === "updated").length || 0;
      toast.success(`Market scrape complete: ${successCount} predictions updated`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to trigger market scraper");
    } finally {
      setRunningMarkets(false);
    }
  };

  const triggerLegacyScraper = async () => {
    setRunningLegacy(true);
    toast.info("Triggering ClinicalTrials.gov scraper...");

    try {
      const { data, error } = await supabase.functions.invoke("scrape-clinical-trials", {
        body: { adminEmail: "" },
      });

      if (error) throw error;
      toast.success(`Completed: ${data.trialsAdded} new, ${data.trialsUpdated || 0} updated`);
      fetchRuns();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to trigger scraper");
    } finally {
      setRunningLegacy(false);
    }
  };

  const triggerFirehoseScraper = async () => {
    setRunningFirehose(true);
    toast.info("🚀 Starting psychedelic data firehose...");

    try {
      const { data, error } = await supabase.functions.invoke("scrape-all", {
        body: { adminEmail: "" },
      });

      if (error) throw error;
      toast.success(`🎉 Firehose complete: ${data.totalAdded} new items from 5 sources`);
      fetchRuns();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to trigger firehose scraper");
    } finally {
      setRunningFirehose(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-500",
      error: "bg-red-500",
      running: "bg-yellow-500",
    };
    return (
      <Badge className={colors[status] || "bg-gray-500"}>
        {status}
      </Badge>
    );
  };

  const getSourceBadge = (scraper: string, source?: string) => {
    const key = source === "all" ? "all" : scraper === "psychedelic_firehose" ? "all" : scraper;
    const config = SOURCE_BADGES[key] || SOURCE_BADGES.clinicaltrials_gov;
    return (
      <Badge variant="outline" className={`gap-1 ${config.color} text-white border-0`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const firehoseUrl = `https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/scrape-all`;
  const legacyUrl = `https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/scrape-clinical-trials`;
  const marketsUrl = `https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/scrape-markets`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scraper Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const firehoseRuns = runs.filter(r => r.scraper_name === "psychedelic_firehose");
  const legacyRuns = runs.filter(r => r.scraper_name === "clinicaltrials_gov");
  const lastFirehose = firehoseRuns[0];
  const lastLegacy = legacyRuns[0];

  return (
    <div className="space-y-6">
      {/* Market Predictions Scraper */}
      <Card className="border-blue-500/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Market Predictions Scraper
            <Badge variant="outline" className="ml-2">Metaculus + Polymarket</Badge>
          </CardTitle>
          <Button
            onClick={triggerMarketScraper}
            disabled={runningMarkets}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${runningMarkets ? "animate-spin" : ""}`} />
            {runningMarkets ? "Scraping..." : "Run Now"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 bg-orange-500 text-white border-0">
              Metaculus
            </Badge>
            <Badge variant="outline" className="gap-1 bg-blue-500 text-white border-0">
              Polymarket
            </Badge>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <strong>Schedule:</strong> Daily at 06:00 UTC (via cron-job.org)
            </div>
            <div className="text-muted-foreground">
              <strong>Data:</strong> AGI predictions, AI reasoning milestones
            </div>
            {lastMarketScrape && (
              <div className="text-muted-foreground">
                <strong>Last scraped:</strong> {new Date(lastMarketScrape).toLocaleString()}
              </div>
            )}
          </div>

          {/* Cron Setup */}
          <div className="border border-dashed rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Cron Setup (cron-job.org)</p>
            <div className="bg-background rounded p-2 text-xs font-mono break-all">
              {marketsUrl}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Expression: <code className="bg-muted px-1 rounded">0 6 * * *</code>
              </p>
              <a
                href="https://cron-job.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open cron-job.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Results Display */}
          {marketResults && marketResults.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-semibold">Latest Results</span>
              </div>
              <div className="space-y-2">
                {marketResults.map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${result.source === 'metaculus' ? 'bg-orange-500' : 'bg-blue-500'} text-white border-0 text-xs`}>
                        {result.source}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[200px]">{result.event}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.median && <span className="text-xs">Median: {result.median}</span>}
                      {result.probability && <span className="text-xs font-medium">{result.probability}</span>}
                      {result.status === "updated" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Firehose Scraper - Primary */}
      <Card className="border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Psychedelic Data Firehose
            <Badge variant="outline" className="ml-2">5 Sources</Badge>
          </CardTitle>
          <Button
            onClick={triggerFirehoseScraper}
            disabled={runningFirehose}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${runningFirehose ? "animate-spin" : ""}`} />
            {runningFirehose ? "Running..." : "Run All Sources"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sources List */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(SOURCE_BADGES).filter(([k]) => k !== "all").map(([key, config]) => (
              <Badge key={key} variant="outline" className={`gap-1 ${config.color} text-white border-0`}>
                {config.icon}
                {config.label}
              </Badge>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <strong>Schedule:</strong> Every Sunday at 03:00 UTC
            </div>
            <div className="text-muted-foreground">
              <strong>Compounds:</strong> DMT, psilocybin, LSD, MDMA, ketamine, ibogaine, ayahuasca, 5-MeO-DMT, salvinorin A
            </div>
            <div className="text-muted-foreground">
              <strong>Features:</strong> Auto-populates /events, /trials, /retreats, /bibliography
            </div>
          </div>

          {/* Cron Setup */}
          <div className="border border-dashed rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Cron Setup (cron-job.org)</p>
            <div className="bg-background rounded p-2 text-xs font-mono break-all">
              {firehoseUrl}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Expression: <code className="bg-muted px-1 rounded">0 3 * * 0</code>
              </p>
              <a
                href="https://cron-job.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open cron-job.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {lastFirehose && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(lastFirehose.status)}
                  <span className="font-semibold">Last Firehose Run</span>
                </div>
                <div className="flex items-center gap-2">
                  {lastFirehose.email_sent && (
                    <Badge variant="outline" className="gap-1">
                      <Mail className="w-3 h-3" />
                      Email Sent
                    </Badge>
                  )}
                  {getStatusBadge(lastFirehose.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-medium">{new Date(lastFirehose.last_run_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Items Found:</span>
                  <p className="font-medium">{lastFirehose.trials_found}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">New Items Added:</span>
                  <p className="font-medium text-green-600">{lastFirehose.trials_added}</p>
                </div>
              </div>

              {lastFirehose.error_message && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-sm text-red-500 font-medium">Error:</p>
                  <p className="text-xs text-muted-foreground mt-1">{lastFirehose.error_message}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legacy Scraper */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            ClinicalTrials.gov Only
            <Badge variant="outline">Legacy</Badge>
          </CardTitle>
          <Button
            onClick={triggerLegacyScraper}
            disabled={runningLegacy}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${runningLegacy ? "animate-spin" : ""}`} />
            {runningLegacy ? "Running..." : "Run"}
          </Button>
        </CardHeader>
        <CardContent>
          {lastLegacy && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(lastLegacy.status)}
                <span>{new Date(lastLegacy.last_run_at).toLocaleString()}</span>
              </div>
              <span>+{lastLegacy.trials_added} trials</span>
              {getStatusBadge(lastLegacy.status)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run History */}
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runs.slice(0, 10).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between text-xs py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <span className="text-muted-foreground">
                      {new Date(run.last_run_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSourceBadge(run.scraper_name, run.source)}
                    <span className="text-green-600">+{run.trials_added}</span>
                    {run.email_sent && <Mail className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
