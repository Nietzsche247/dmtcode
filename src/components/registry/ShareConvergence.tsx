import { useState } from 'react';
import { Copy, Download, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareConvergenceProps {
  symbolId: string;
  seenItCount: number;
}

const trackGA = (event: string, params: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, params);
  }
};

/**
 * Share affordance for the recognition reveal. Presentation only.
 * No login required. Never writes to convergence data.
 */
export const ShareConvergence = ({ symbolId, seenItCount }: ShareConvergenceProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const url = `https://dmtcode.com/registry/${symbolId}`;
  const svgUrl = `https://dmtcode.com/card/${symbolId}.svg`;
  const pngUrl = `https://dmtcode.com/card/${symbolId}.png`;
  const shareText =
    seenItCount > 0
      ? `1 of ${seenItCount.toLocaleString()} recognized this symbol on dmtcode.com`
      : 'Be the first to recognize this symbol on dmtcode.com';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackGA('convergence_share', { method: 'copy_link', symbol_id: symbolId });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: 'Could not copy link', variant: 'destructive' });
    }
  };

  const handleNativeShare = async () => {
    trackGA('convergence_share', { method: 'web_share', symbol_id: symbolId });
    try {
      await (navigator as any).share({ title: 'DMT Code', text: shareText, url });
    } catch {
      /* user dismissed */
    }
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  return (
    <div className="w-full rounded-lg border border-border bg-muted/40 p-3 space-y-2">
      <p className="font-body text-sm text-muted-foreground">
        Share this convergence
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {canNativeShare ? (
          <Button type="button" variant="outline" size="sm" onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={pngUrl}
              download={`dmtcode-${symbolId.slice(0, 8)}.png`}
              onClick={() => trackGA('convergence_share', { method: 'download_png', symbol_id: symbolId })}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PNG
            </a>
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" asChild>
          <a
            href={svgUrl}
            download={`dmtcode-${symbolId.slice(0, 8)}.svg`}
            onClick={() => trackGA('convergence_share', { method: 'download_svg', symbol_id: symbolId })}
          >
            <Download className="w-4 h-4 mr-1.5" />
            SVG
          </a>
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <a
            href={pngUrl}
            download={`dmtcode-${symbolId.slice(0, 8)}.png`}
            onClick={() => trackGA('convergence_share', { method: 'download_png', symbol_id: symbolId })}
          >
            <Download className="w-4 h-4 mr-1.5" />
            PNG
          </a>
        </Button>
      </div>
    </div>
  );
};
