import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface CanvasExportProps {
  imageData: string;
  svgData?: string;
  symbolId: string;
}

export const CanvasExport = ({ imageData, svgData, symbolId }: CanvasExportProps) => {
  const downloadPNG = () => {
    if (!imageData) {
      toast.error('No image data available');
      return;
    }

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `dmtcode-symbol-${symbolId}-1200px.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PNG downloaded');
  };

  const downloadSVG = () => {
    if (!svgData) {
      toast.error('No SVG data available');
      return;
    }

    // Create blob with proper SVG header
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dmtcode-symbol-${symbolId}-vector.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Research-ready SVG downloaded (1200×1200px, 300 DPI)');
  };

  return (
    <div className="bg-muted/50 p-6 rounded-lg space-y-4">
      <h4 className="text-lg font-semibold">Download Your Symbol</h4>
      <div className="flex flex-col gap-3">
        <Button 
          onClick={downloadPNG} 
          variant="outline" 
          className="w-full"
          aria-label="Download PNG image at 1200×1200 pixels"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PNG (1200×1200px)
        </Button>
        {svgData && (
          <Button 
            onClick={downloadSVG} 
            variant="default" 
            className="w-full"
            aria-label="Download research-ready SVG vector at 1200×1200 pixels, 300 DPI"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Research-Ready SVG (Vector, 300 DPI)
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        PNG: High-resolution raster (1200×1200px). SVG: Scalable vector format for publication-quality reproduction.
      </p>
    </div>
  );
};
