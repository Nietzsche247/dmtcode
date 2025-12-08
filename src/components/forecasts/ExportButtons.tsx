import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { ForecastEvent, Methodology, DependencyRule } from "@/lib/forecasts-api";
import { exportAsJSON, exportAsCSV } from "@/lib/forecasts-api";

interface ExportButtonsProps {
  events: ForecastEvent[];
  methodology: Methodology[];
  dependencyRules?: DependencyRule[];
}

const EXTERNAL_SUPABASE_URL = 'https://nhpesihbzrxiherrqhfh.supabase.co';

export function ExportButtons({ events, methodology, dependencyRules = [] }: ExportButtonsProps) {
  const handleJSONExport = () => {
    exportAsJSON(events, methodology);
    toast.success('JSON file downloaded');
  };

  const handleCSVExport = () => {
    exportAsCSV(events);
    toast.success('CSV file downloaded');
  };

  const handleCopyAPI = () => {
    navigator.clipboard.writeText(`${EXTERNAL_SUPABASE_URL}/rest/v1/forecasts?select=*`);
    toast.success('API endpoint copied to clipboard');
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'AI Timeline Forecasts 2026-2030',
        text: 'Interactive probability model of transformative AI events',
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  // Calculate cascade count
  const cascadeCount = events.reduce((acc, e) => 
    acc + (e.cascadeEffects?.tier_1?.length || 0) + 
    (e.cascadeEffects?.tier_2?.length || 0) + 
    (e.cascadeEffects?.tier_3?.length || 0), 0
  );

  return (
    <div className="bg-card/30 border border-border/50 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="font-mono text-foreground">{events.length}</span> Events
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-foreground">{dependencyRules.length}</span> Dependencies
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-foreground">{cascadeCount}</span> Cascades
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
            onClick={handleJSONExport}
          >
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> JSON
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
            onClick={handleCSVExport}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
            onClick={handleCopyAPI}
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Copy</span> API
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
