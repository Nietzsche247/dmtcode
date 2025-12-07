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
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
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

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
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
            <Button onClick={this.handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Loading Canvas
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
