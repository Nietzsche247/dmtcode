import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { ForecastEvent, Methodology } from "@/lib/forecasts-api";
import { exportAsJSON, exportAsCSV } from "@/lib/forecasts-api";

interface ExportButtonsProps {
  events: ForecastEvent[];
  methodology: Methodology[];
}

const EXTERNAL_SUPABASE_URL = 'https://nhpesihbzrxiherrqhfh.supabase.co';

export function ExportButtons({ events, methodology }: ExportButtonsProps) {
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

  const handleViewRaw = () => {
    window.open(`${EXTERNAL_SUPABASE_URL}`, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
        onClick={handleJSONExport}
      >
        <FileJson className="w-4 h-4" />
        Download JSON
      </Button>
      
      <Button
        variant="outline"
        className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
        onClick={handleCSVExport}
      >
        <FileSpreadsheet className="w-4 h-4" />
        Download CSV
      </Button>
      
      <Button
        variant="outline"
        className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
        onClick={handleCopyAPI}
      >
        <Link2 className="w-4 h-4" />
        Copy API Endpoint
      </Button>
      
      <Button
        variant="outline"
        className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-primary/50"
        onClick={handleViewRaw}
      >
        <ExternalLink className="w-4 h-4" />
        View Raw Data
      </Button>
    </div>
  );
}
