import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const OnPageAuditor = () => {
  const auditResults = [
    { page: '/home', score: 95, issues: ['Add alt text to hero image'] },
    { page: '/research', score: 92, issues: ['Meta description could be shorter', 'Add more internal links'] },
    { page: '/tools', score: 88, issues: ['Improve page speed', 'Optimize images', 'Add structured data'] },
    { page: '/waitlist', score: 94, issues: ['Add canonical URL'] }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lighthouse Audit Results</CardTitle>
          <CardDescription>
            Automated performance and SEO checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {auditResults.map((result) => (
            <div key={result.page} className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{result.page}</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={result.score >= 90 ? 'default' : result.score >= 70 ? 'secondary' : 'destructive'}
                  >
                    {result.score}%
                  </Badge>
                  {result.score >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : result.score >= 70 ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                {result.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span>•</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="w-full">
                Preview Fixes
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
          <CardDescription>
            Automated meta and alt-text recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">/tools - Hero Image</p>
            <p className="text-xs text-muted-foreground mb-2">Current: (missing)</p>
            <p className="text-xs font-medium">Suggested alt text:</p>
            <p className="text-xs text-muted-foreground italic">
              "650nm laser diffraction for DMT entities - verified equipment for Reality exploration"
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Apply
            </Button>
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">/research - Meta Description</p>
            <p className="text-xs text-muted-foreground mb-2">
              Current: 178 chars (too long)
            </p>
            <p className="text-xs font-medium">Suggested (155 chars):</p>
            <p className="text-xs text-muted-foreground italic">
              "Peer-reviewed DMT research: Goler's 2025 Protocol, Davis entity surveys, Timmermann neural studies. 20+ papers on DMT phenomenology."
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>One-Click Optimization</CardTitle>
          <CardDescription>
            Apply all suggested fixes (preview only, no auto-overwrite)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">
            Preview All Fixes
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            You'll review changes before applying
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
