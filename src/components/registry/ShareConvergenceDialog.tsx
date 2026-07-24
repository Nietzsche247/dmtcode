import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShareConvergence } from './ShareConvergence';

interface Props {
  symbolId: string;
  seenItCount: number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  trigger?: React.ReactNode;
}

const trackGA = (event: string, params: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, params);
  }
};

export const ShareConvergenceDialog = ({
  symbolId,
  seenItCount,
  open,
  onOpenChange,
  trigger,
}: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open! : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [hideImg, setHideImg] = useState(false);

  useEffect(() => {
    if (actualOpen) {
      setHideImg(false);
      trackGA('convergence_card_previewed', { symbol_id: symbolId });
    }
  }, [actualOpen, symbolId]);

  const content = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="text-left">
        <DialogTitle className="font-display text-xl">Share this convergence</DialogTitle>
      </DialogHeader>
      {!hideImg && (
        <img
          src={`/card/${symbolId}.svg`}
          alt="Convergence card for this symbol"
          loading="lazy"
          onError={() => setHideImg(true)}
          className="w-full rounded-lg border border-border"
        />
      )}
      <ShareConvergence symbolId={symbolId} seenItCount={seenItCount} />
    </DialogContent>
  );

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      {content}
    </Dialog>
  );
};

export const ShareConvergenceButton = ({
  symbolId,
  seenItCount,
}: {
  symbolId: string;
  seenItCount: number;
}) => (
  <ShareConvergenceDialog
    symbolId={symbolId}
    seenItCount={seenItCount}
    trigger={
      <Button variant="outline" size="sm" className="rounded-full gap-2">
        <Share2 className="w-4 h-4" />
        Share this convergence
      </Button>
    }
  />
);
