import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorBoundaryFallback = ({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        {/* Laser calibration animation */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
          <div className="absolute inset-2 rounded-full border border-primary/50 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_hsl(var(--primary))]" />
          </div>
          {/* Laser beams */}
          <div className="absolute top-1/2 left-full w-8 h-[2px] bg-gradient-to-r from-primary to-transparent -translate-y-1/2 animate-pulse" />
          <div className="absolute top-1/2 right-full w-8 h-[2px] bg-gradient-to-l from-primary to-transparent -translate-y-1/2 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight">Calibrating lasers…</h2>
          <p className="text-sm text-muted-foreground font-light">
            {error?.message || 'Something went wrong while loading this section.'}
          </p>
        </div>

        {resetErrorBoundary && (
          <Button 
            onClick={resetErrorBoundary}
            variant="outline"
            className="rounded-full gap-2 touch-manipulation min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}

        <p className="text-xs text-muted-foreground/60">
          If this persists, please contact support.
        </p>
      </div>
    </div>
  );
};