import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';

export const ConversionFunnel = () => {
  const funnelSteps = [
    { name: 'Landing', visitors: 10000, conversion: 100, source: 'Mixed' },
    { name: 'Research Read', visitors: 6800, conversion: 68, source: '42% from AI citations' },
    { name: 'Tools View', visitors: 4420, conversion: 65, source: '38% from Goler study mention' },
    { name: 'Waitlist/Affiliate', visitors: 1768, conversion: 40, source: '15% from laser queries' }
  ];

  const alerts = [
    {
      type: 'spike',
      message: 'New AI mention spike on Goler study',
      impact: '+23 citations in last 7 days',
      date: '2 hours ago'
    },
    {
      type: 'ranking',
      message: '"Journey query ranking drop"',
      impact: 'Position 2→5 for "DMT laser journey"',
      date: '1 day ago'
    },
    {
      type: 'opportunity',
      message: 'High-potential prompt detected',
      impact: '"laser DMT tools" - 340 monthly searches',
      date: '3 days ago'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Overlay GEO/SEO data on user journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelSteps.map((step, idx) => (
            <div key={step.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <p className="text-sm font-medium">{step.name}</p>
                  </div>
                  {idx < funnelSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {step.visitors.toLocaleString()} visitors
                  </span>
                  <Badge variant="secondary">
                    {step.conversion}%
                  </Badge>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${step.conversion}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground pl-24">
                {step.source}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drop-off Analysis</CardTitle>
          <CardDescription>
            Where users are leaving and why
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Research → Tools (35% drop-off)</p>
                <p className="text-xs text-muted-foreground">
                  Users reading research but not viewing tools. Suggest: Add more internal links from research to equipment.
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Tools → Conversion (60% drop-off)</p>
                <p className="text-xs text-muted-foreground">
                  High interest but low conversion. Suggest: Simplify checkout, add urgency messaging.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Alerts</CardTitle>
          <CardDescription>
            Email/Slack notifications for critical events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.impact}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {alert.date}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Citation Impact Tracking</CardTitle>
          <CardDescription>
            Which citations drive affiliate purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">Goler citation (IPI Letters)</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">15% affiliate traffic</Badge>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">Timmermann neural data</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">8% affiliate traffic</Badge>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">Laser protocol mentions</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">22% affiliate traffic</Badge>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
