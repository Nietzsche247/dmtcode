import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  ShoppingCart, 
  Eye, 
  Package, 
  ArrowUpRight, 
  DollarSign,
  Users,
  Target
} from 'lucide-react';

// Mock data - in production this would come from PostHog API
const bundleMetrics = {
  starter: {
    name: 'Fractal Starter Kit',
    price: 85,
    views: 1247,
    addToCart: 312,
    purchases: 89,
    revenue: 7565,
    conversionRate: 7.14,
  },
  gateway: {
    name: 'Gateway Research Kit',
    price: 1200,
    views: 892,
    addToCart: 156,
    purchases: 34,
    revenue: 40800,
    conversionRate: 3.81,
  },
  complete: {
    name: 'Complete Symbol Kit',
    price: 2300,
    views: 534,
    addToCart: 78,
    purchases: 12,
    revenue: 27600,
    conversionRate: 2.25,
  },
  ceremony: {
    name: 'Extended Ceremony Package',
    price: 3500,
    views: 321,
    addToCart: 45,
    purchases: 6,
    revenue: 21000,
    conversionRate: 1.87,
  },
};

const upsellMetrics = {
  shown: 2847,
  clicked: 423,
  converted: 67,
  clickRate: 14.86,
  conversionRate: 15.84,
  revenueGenerated: 5695,
};

const funnelSteps = [
  { name: 'Product Views', count: 2994, percentage: 100 },
  { name: 'Add to Cart', count: 591, percentage: 19.74 },
  { name: 'Checkout Started', count: 267, percentage: 8.92 },
  { name: 'Purchase Complete', count: 141, percentage: 4.71 },
];

export const BundleAnalytics = () => {
  const totalRevenue = Object.values(bundleMetrics).reduce((sum, b) => sum + b.revenue, 0);
  const totalPurchases = Object.values(bundleMetrics).reduce((sum, b) => sum + b.purchases, 0);
  const avgOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

  return (
    <div className="space-y-6">
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
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +23.5% from last month
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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +12.3% from last month
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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +8.2% from last month
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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +5.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bundle Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Bundle Performance</CardTitle>
          <CardDescription>Conversion metrics for each research bundle</CardDescription>
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
          
          <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Key Insight</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Users who view the Protocol Starter Kit upsell are <span className="text-primary font-semibold">2.3x more likely</span> to complete purchase. 
              Consider showing upsell earlier in the cart flow.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PostHog Events */}
      <Card>
        <CardHeader>
          <CardTitle>PostHog Event Stream</CardTitle>
          <CardDescription>Recent tracking events from store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              { event: 'bundle_viewed', bundle: 'starter', time: '2 min ago' },
              { event: 'bundle_added_to_cart', bundle: 'gateway', time: '5 min ago' },
              { event: 'bundle_upsell_shown', bundle: 'starter', time: '8 min ago' },
              { event: 'checkout_started', bundle: 'complete', time: '12 min ago' },
              { event: 'bundle_viewed', bundle: 'ceremony', time: '15 min ago' },
              { event: 'bundle_upsell_clicked', bundle: 'starter', time: '18 min ago' },
              { event: 'bundle_viewed', bundle: 'gateway', time: '22 min ago' },
              { event: 'bundle_added_to_cart', bundle: 'starter', time: '25 min ago' },
            ].map((event, i) => (
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
        </CardContent>
      </Card>
    </div>
  );
};
