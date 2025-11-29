import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileJson, FileSpreadsheet, FolderArchive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const RegistryDownloads = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportJSON = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('registry_glyphs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dmtcode-registry-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('JSON export downloaded');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export JSON');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('registry_glyphs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const headers = ['id', 'source', 'route_of_administration', 'approximate_dose', 'perceived_surface', 'depth', 'motion', 'emotional_valence', 'communicative_intent', 'prior_exposure', 'symmetry', 'motif_tags', 'confirmation_count', 'created_at'];
      const csvRows = [headers.join(',')];

      data?.forEach(row => {
        const values = headers.map(header => {
          const val = row[header as keyof typeof row];
          if (Array.isArray(val)) return `"${val.join('; ')}"`;
          if (val === null) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });

      const csvStr = csvRows.join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dmtcode-registry-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('CSV export downloaded');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportImages = async () => {
    toast.info('Image archive export coming soon', {
      description: 'This feature will bundle all symbol PNGs into a downloadable ZIP file'
    });
  };

  return (
    <section id="downloads" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Download Complete Dataset</h2>
      
      <Card className="max-w-4xl mx-auto p-8 bg-card border-border">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <FileJson className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">JSON Format</h3>
            <p className="text-sm text-muted-foreground">
              Complete dataset with full metadata, nested structures, and citations
            </p>
            <Button 
              onClick={exportJSON}
              disabled={isExporting}
              className="w-full"
              aria-label="Download registry as JSON"
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <FileSpreadsheet className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">CSV Format</h3>
            <p className="text-sm text-muted-foreground">
              Spreadsheet-compatible format for statistical analysis and Excel
            </p>
            <Button 
              onClick={exportCSV}
              disabled={isExporting}
              className="w-full"
              aria-label="Download registry as CSV"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <FolderArchive className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Image Archive</h3>
            <p className="text-sm text-muted-foreground">
              ZIP file containing all symbol PNGs (100×100 px) with metadata
            </p>
            <Button 
              onClick={exportImages}
              disabled={isExporting}
              variant="outline"
              className="w-full"
              aria-label="Download registry images as ZIP"
            >
              <Download className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-muted/30 border border-border rounded-lg">
          <h4 className="text-base font-semibold mb-3">Dataset License & Attribution</h4>
          <p className="text-sm text-muted-foreground mb-4">
            All registry data released under <strong>Creative Commons Attribution 4.0 International License (CC-BY-4.0)</strong>. Free to download, analyze, and republish with proper attribution.
          </p>
          <p className="text-xs text-muted-foreground italic">
            Cite as: DMT Code Visual Symbol Catalogue, 2025, https://dmtcode.com/registry
          </p>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/data.json" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold hover:underline"
          >
            View live /data.json endpoint →
          </a>
        </div>
      </Card>
    </section>
  );
};
