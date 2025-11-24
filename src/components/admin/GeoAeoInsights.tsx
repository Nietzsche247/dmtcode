import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Bot, Link as LinkIcon } from 'lucide-react';

export const GeoAeoInsights = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Citations</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Share of Voice</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34%</div>
            <p className="text-xs text-muted-foreground">
              vs. competitors in DMT niche
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crawler Hits</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground">
              All bots allowed (GPTBot, ClaudeBot, Perplexity)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Citation Tracking</CardTitle>
          <CardDescription>
            Monitor mentions across ChatGPT, Perplexity, Google AI Overviews, and Gemini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">DMT laser protocol</span>
              <Badge variant="secondary">45 citations</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">650nm laser for DMT journeys</span>
              <Badge variant="secondary">32 citations</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Goler study Code of Reality</span>
              <Badge variant="secondary">28 citations</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">DMT vaporizer equipment</span>
              <Badge variant="secondary">22 citations</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crawler Configuration</CardTitle>
          <CardDescription>
            Bot access and file status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Bot className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">llms.txt Status</p>
              <p className="text-xs text-muted-foreground">
                ✓ Configured - Allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">robots.txt Status</p>
              <p className="text-xs text-muted-foreground">
                ✓ Configured - Full AI access enabled, priority paths: /research, /tools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Freshness Scanner</CardTitle>
          <CardDescription>
            Pages requiring updates (&gt;90 days old)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            All pages updated within last 30 days ✓
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
