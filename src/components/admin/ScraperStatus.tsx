import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, CheckCircle, XCircle, Clock, Mail, ExternalLink } from "lucide-react";
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
}

export const ScraperStatus = () => {
  const [lastRun, setLastRun] = useState<ScraperRun | null>(null);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchLastRun();
  }, []);

  const fetchLastRun = async () => {
    const { data, error } = await supabase
      .from("scraper_runs")
      .select("*")
      .eq("scraper_name", "clinicaltrials_gov")
      .order("last_run_at", { ascending: false })
      .limit(5);

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching scraper status:", error);
    } else if (data && data.length > 0) {
      setLastRun(data[0]);
      setRuns(data);
    }
    setLoading(false);
  };

  const triggerScraper = async () => {
    setRunning(true);
    toast.info("Triggering clinical trials scraper...");

    try {
      const { data, error } = await supabase.functions.invoke("scrape-clinical-trials", {
        body: { adminEmail: "" }, // Add admin email here if needed
      });

      if (error) throw error;

      toast.success(`Scraper completed: ${data.trialsAdded} new, ${data.trialsUpdated || 0} updated`);
      fetchLastRun();
    } catch (error) {
      console.error("Error triggering scraper:", error);
      toast.error("Failed to trigger scraper");
    } finally {
      setRunning(false);
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

  const functionUrl = `https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/scrape-clinical-trials`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ClinicalTrials.gov Scraper</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          ClinicalTrials.gov Scraper
        </CardTitle>
        <Button
          onClick={triggerScraper}
          disabled={running}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${running ? "animate-spin" : ""}`} />
          {running ? "Running..." : "Run Now"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <strong>Schedule:</strong> Every Sunday at 03:00 UTC (via cron-job.org)
          </div>
          <div className="text-muted-foreground">
            <strong>Compounds:</strong> DMT, N,N-DMT, psilocybin, ayahuasca, 5-MeO-DMT, ibogaine, LSD, MDMA
          </div>
          <div className="text-muted-foreground">
            <strong>Filters:</strong> Recruiting/Active/Not-yet-recruiting, start date ≥ 2024
          </div>
        </div>

        {/* Cron Setup Instructions */}
        <div className="border border-dashed rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium">Setup Weekly Cron (cron-job.org)</p>
          <div className="bg-background rounded p-2 text-xs font-mono break-all">
            {functionUrl}
          </div>
          <a
            href="https://cron-job.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open cron-job.org <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-xs text-muted-foreground">
            Cron expression: <code className="bg-muted px-1 rounded">0 3 * * 0</code> (Sunday 03:00 UTC)
          </p>
        </div>

        {lastRun ? (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(lastRun.status)}
                <span className="font-semibold">Last Run</span>
              </div>
              <div className="flex items-center gap-2">
                {lastRun.email_sent && (
                  <Badge variant="outline" className="gap-1">
                    <Mail className="w-3 h-3" />
                    Email Sent
                  </Badge>
                )}
                {getStatusBadge(lastRun.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">
                  {new Date(lastRun.last_run_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Trials Found:</span>
                <p className="font-medium">{lastRun.trials_found}</p>
              </div>
              <div>
                <span className="text-muted-foreground">New Trials Added:</span>
                <p className="font-medium text-green-600">{lastRun.trials_added}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duplicates Skipped:</span>
                <p className="font-medium">
                  {lastRun.trials_found - lastRun.trials_added}
                </p>
              </div>
            </div>

            {lastRun.error_message && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                <p className="text-sm text-red-500 font-medium">Error:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lastRun.error_message}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No scraper runs recorded yet. Click "Run Now" to start.
          </p>
        )}

        {/* Run History */}
        {runs.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Runs</p>
            <div className="space-y-1">
              {runs.slice(1).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between text-xs text-muted-foreground py-1 border-b last:border-0"
                >
                  <span>{new Date(run.last_run_at).toLocaleDateString()}</span>
                  <span>+{run.trials_added} trials</span>
                  {getStatusBadge(run.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
