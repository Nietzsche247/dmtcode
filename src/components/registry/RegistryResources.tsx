import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const RegistryResources = () => {
  const handleDownload = async (format: 'json' | 'csv' | 'png') => {
    try {
      const { data, error } = await supabase
        .from('registry_glyphs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'registry-data.json');
      } else if (format === 'csv') {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, 'registry-data.csv');
      } else if (format === 'png') {
        toast.info('PNG archive download would be implemented with backend processing');
      }

      toast.success(`${format.toUpperCase()} download initiated`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="container mx-auto px-4 py-16 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Open Data Access</h2>
        
        <Card className="p-8 bg-card border-border">
          <p className="text-center text-muted-foreground mb-8 leading-relaxed">
            Complete dataset available under <a 
              href="https://creativecommons.org/licenses/by/4.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[hsl(var(--gold))] hover:underline"
            >
              CC-BY-4.0
            </a> for academic and non-commercial research.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('json')}
            >
              <Download className="mr-2 h-4 w-4" />
              JSON (Full Records)
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('csv')}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV (Flattened Table)
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('png')}
            >
              <Download className="mr-2 h-4 w-4" />
              PNG Archive
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
            <p className="font-mono">
              DMT Code Glyph Registry, 2025–present, https://dmtcode.com/registry
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
