import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, MousePointer, BarChart3 } from 'lucide-react';

export const SeoInsights = () => {
  const keywords = [
    { term: 'DMT 650nm code', position: 3, impressions: 12400, clicks: 890, ctr: 7.2 },
    { term: 'laser DMT experiment', position: 5, impressions: 8900, clicks: 623, ctr: 7.0 },
    { term: 'where to buy DMT laser', position: 2, impressions: 6700, clicks: 512, ctr: 7.6 },
    { term: 'Goler DMT protocol', position: 1, impressions: 4200, clicks: 445, ctr: 10.6 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.2K</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.47K</div>
            <p className="text-xs text-muted-foreground">
              +24% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.7%</div>
            <p className="text-xs text-muted-foreground">
              Above industry avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Referrals</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18%</div>
            <p className="text-xs text-muted-foreground">
              Of total organic traffic
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Keywords</CardTitle>
          <CardDescription>
            Organic search performance from Google Search Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {keywords.map((kw) => (
              <div key={kw.term} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{kw.term}</p>
                    <Badge variant="outline" className="text-xs">
                      #{kw.position}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{kw.impressions.toLocaleString()} impressions</span>
                    <span>•</span>
                    <span>{kw.clicks} clicks</span>
                    <span>•</span>
                    <span>{kw.ctr}% CTR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>
            Breakdown of organic vs. AI referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Google Organic</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '64%' }} />
                </div>
                <span className="text-sm font-medium">64%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Engines (ChatGPT, Perplexity)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '18%' }} />
                </div>
                <span className="text-sm font-medium">18%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Direct</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '12%' }} />
                </div>
                <span className="text-sm font-medium">12%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Social</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '6%' }} />
                </div>
                <span className="text-sm font-medium">6%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
