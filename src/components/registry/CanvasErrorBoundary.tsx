import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  resetKey: number;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Canvas error:', error, errorInfo);

    // Track error in PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('canvas_error', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
      });
    }
  }

  // Bumping the key forces a full remount of the canvas subtree, so retry is a
  // genuine re-attempt rather than a re-render of the same broken instance.
  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: undefined, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center border-destructive/50 bg-destructive/5">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {this.props.fallbackMessage || 'Canvas loading failed'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                There was an issue loading the drawing canvas. This might be due to browser
                compatibility or memory constraints. Please try again.
              </p>
            </div>
            <Button onClick={this.handleRetry} variant="outline" className="gap-2 min-h-[44px]">
              <RefreshCw className="h-4 w-4" />
              Retry loading canvas
            </Button>
          </div>
        </Card>
      );
    }

    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}

