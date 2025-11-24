import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ContentAuditor = () => {
  const pages = [
    { name: '/research', score: 92, issues: 1, status: 'excellent' },
    { name: '/tools', score: 88, issues: 2, status: 'good' },
    { name: '/home', score: 95, issues: 0, status: 'excellent' },
    { name: '/waitlist', score: 85, issues: 3, status: 'good' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GEO Audit Scores</CardTitle>
          <CardDescription>
            Page optimization for AI crawlers and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pages.map((page) => (
            <div key={page.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{page.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{page.score}%</span>
                  {page.status === 'excellent' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <Progress value={page.score} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {page.issues} issue{page.issues !== 1 ? 's' : ''} found
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Optimization</CardTitle>
          <CardDescription>
            Modular Q&A blocks and authoritative stats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">How do 650nm lasers enhance DMT journeys?</p>
                <p className="text-xs text-muted-foreground">
                  ✓ Goler's Protocol reference • Timmermann et al. (2019) neural data • 200 words
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">What equipment is needed for replication?</p>
                <p className="text-xs text-muted-foreground">
                  ✓ Product links • Safety guidelines • IEEE laser specs • 175 words
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schema Markup Builder</CardTitle>
          <CardDescription>
            One-click JSON-LD embeds for all pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">FAQ Schema (/research)</span>
              <Button size="sm" variant="outline">Generate</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Product Schema (/tools)</span>
              <Button size="sm" variant="outline">Generate</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">HowTo Schema (/research)</span>
              <Button size="sm" variant="outline">Generate</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Linking Optimizer</CardTitle>
          <CardDescription>
            Topical authority mapping for "DMT code reality"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>/home → /research (3 links)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>/research → /tools (4 links)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>/tools → /waitlist (2 links)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Suggestion: Add /waitlist → /research link</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
