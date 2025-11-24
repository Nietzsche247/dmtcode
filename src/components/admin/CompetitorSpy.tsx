import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const CompetitorSpy = () => {
  const competitors = [
    { 
      name: 'DMT Nexus', 
      citations: 89, 
      trend: 'down',
      score: 72,
      backlinks: 1240 
    },
    { 
      name: 'Erowid.org', 
      citations: 156, 
      trend: 'up',
      score: 85,
      backlinks: 3450 
    },
    { 
      name: 'Code of Reality', 
      citations: 43, 
      trend: 'neutral',
      score: 65,
      backlinks: 420 
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitor Tracking</CardTitle>
          <CardDescription>
            Monitor AI citations and GEO performance vs. rivals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Add competitor URL (e.g., dmtnexus.me)" />
            <Button>Track</Button>
          </div>

          <div className="space-y-3">
            {competitors.map((comp) => (
              <div key={comp.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{comp.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{comp.citations} citations</span>
                    <span>•</span>
                    <span>GEO: {comp.score}%</span>
                    <span>•</span>
                    <span>{comp.backlinks.toLocaleString()} backlinks</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {comp.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {comp.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {comp.trend === 'neutral' && <Minus className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitive Analysis</CardTitle>
          <CardDescription>
            Our position vs. competitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Our Citations</p>
              <p className="text-2xl font-bold">127</p>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                Rank #2
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Our GEO Score</p>
              <p className="text-2xl font-bold">92%</p>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                Rank #1
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Strategy Suggestions</CardTitle>
          <CardDescription>
            Actionable insights based on competitor data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">Opportunity: Keyword Gap</p>
            <p className="text-xs text-muted-foreground">
              Add "psychedelic laser experiments" cluster - Erowid ranks but we don't. Potential 20% citation lift.
            </p>
          </div>
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">Strategy: Quote Authority</p>
            <p className="text-xs text-muted-foreground">
              Competitors use Strassman quotes heavily. Integrate more Spirit Molecule references for niche authority.
            </p>
          </div>
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">Link Building: Biohacking Forums</p>
            <p className="text-xs text-muted-foreground">
              Cross-link to Bulletproof, Quantified Self communities. Competitors lack this backlink source.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
