import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  ShoppingCart, 
  Eye, 
  Package, 
  ArrowUpRight, 
  DollarSign,
  Target,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BundleMetric {
  name: string;
  price: number;
  views: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

interface UpsellMetrics {
  shown: number;
  clicked: number;
  converted: number;
  dismissed: number;
  clickRate: number;
  conversionRate: number;
  revenueGenerated: number;
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

interface RecentEvent {
  event: string;
  bundle: string;
  time: string;
}

interface AnalyticsData {
  bundleMetrics: Record<string, BundleMetric>;
  upsellMetrics: UpsellMetrics;
  funnelSteps: FunnelStep[];
  recentEvents: RecentEvent[];
  dateRange: { start: string; end: string };
  totalEvents: number;
}

export const BundleAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: response, error: fetchError } = await supabase.functions.invoke('posthog-analytics');
      
      if (fetchError) throw fetchError;
      if (response?.error) throw new Error(response.error);
      
      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Analytics Unavailable</h3>
              <p className="text-muted-foreground text-sm mt-1">{error}</p>
            </div>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bundleMetrics = data?.bundleMetrics || {};
  const upsellMetrics = data?.upsellMetrics || { shown: 0, clicked: 0, converted: 0, clickRate: 0, conversionRate: 0, revenueGenerated: 0 };
  const funnelSteps = data?.funnelSteps || [];
  const recentEvents = data?.recentEvents || [];

  const totalRevenue = Object.values(bundleMetrics).reduce((sum, b) => sum + b.revenue, 0);
  const totalPurchases = Object.values(bundleMetrics).reduce((sum, b) => sum + b.purchases, 0);
  const avgOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">PostHog Analytics</h2>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          {data?.dateRange && (
            <p className="text-xs text-muted-foreground">
              Data range: {data.dateRange.start} to {data.dateRange.end}
            </p>
          )}
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {data?.totalEvents || 0} events tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              From checkout starts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per completed checkout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upsell Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upsellMetrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {upsellMetrics.shown} upsells shown
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bundle Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Bundle Performance</CardTitle>
          <CardDescription>Conversion metrics for each research bundle (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(bundleMetrics).map(([id, bundle]) => (
              <div key={id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      ${bundle.price}
                    </Badge>
                    <span className="font-medium">{bundle.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {bundle.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" /> {bundle.addToCart}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" /> {bundle.purchases}
                    </span>
                    <Badge variant="secondary">{bundle.conversionRate}%</Badge>
                  </div>
                </div>
                <Progress value={bundle.conversionRate * 10} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>User journey from view to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelSteps.map((step, i) => (
              <div key={step.name} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{step.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {step.count.toLocaleString()}
                    </span>
                    <Badge variant={step.percentage > 10 ? 'default' : 'secondary'}>
                      {step.percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-md overflow-hidden">
                  <div 
                    className="h-full bg-primary/80 transition-all duration-500"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 text-muted-foreground">
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upsell Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Upsell Effectiveness</CardTitle>
          <CardDescription>Bundle upsell prompt performance in cart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold">{upsellMetrics.shown.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Upsells Shown</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold">{upsellMetrics.clicked}</div>
              <div className="text-xs text-muted-foreground">Clicks ({upsellMetrics.clickRate}%)</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold">{upsellMetrics.converted}</div>
              <div className="text-xs text-muted-foreground">Conversions</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-500">
                ${upsellMetrics.revenueGenerated.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Revenue Generated</div>
            </div>
          </div>
          
          {upsellMetrics.shown > 0 && (
            <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Key Insight</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Upsell click-through rate is <span className="text-primary font-semibold">{upsellMetrics.clickRate}%</span>. 
                {upsellMetrics.clickRate > 10 
                  ? ' Performance is strong—consider expanding upsell placement.'
                  : ' Consider testing different upsell messaging or timing.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PostHog Events */}
      <Card>
        <CardHeader>
          <CardTitle>Live Event Stream</CardTitle>
          <CardDescription>Recent tracking events from PostHog</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No events recorded in the last 30 days</p>
              <p className="text-xs mt-1">Events will appear here once users interact with the store</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.event}
                    </Badge>
                    <span className="text-muted-foreground">{event.bundle}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
