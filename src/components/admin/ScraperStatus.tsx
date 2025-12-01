import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ScraperRun {
  id: string;
  scraper_name: string;
  last_run_at: string;
  trials_found: number;
  trials_added: number;
  status: string;
  error_message: string | null;
}

export const ScraperStatus = () => {
  const [lastRun, setLastRun] = useState<ScraperRun | null>(null);
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
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching scraper status:", error);
    } else {
      setLastRun(data);
    }
    setLoading(false);
  };

  const triggerScraper = async () => {
    setRunning(true);
    toast.info("Triggering clinical trials scraper...");

    try {
      const { data, error } = await supabase.functions.invoke("scrape-clinical-trials", {
        body: {},
      });

      if (error) throw error;

      toast.success(`Scraper completed: ${data.trialsAdded} trials added`);
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
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      running: "bg-yellow-500",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-500"}>
        {status}
      </Badge>
    );
  };

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
        <div className="text-sm text-muted-foreground">
          <strong>Schedule:</strong> Every Sunday at 03:00 UTC
        </div>
        <div className="text-sm text-muted-foreground">
          <strong>Substances Tracked:</strong> DMT, psilocybin, LSD, MDMA, ayahuasca, ibogaine, 5-MeO-DMT
        </div>

        {lastRun ? (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(lastRun.status)}
                <span className="font-semibold">Last Run</span>
              </div>
              {getStatusBadge(lastRun.status)}
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
                <p className="font-medium">{lastRun.trials_added}</p>
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
      </CardContent>
    </Card>
  );
};
