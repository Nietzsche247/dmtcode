import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, ExternalLink, Info, Search, Zap } from 'lucide-react';

interface NicheQuery {
  query: string;
  intent: 'informational' | 'transactional' | 'navigational';
  page: string;
}

export const NicheGeoAudit = () => {
  const nicheQueries: NicheQuery[] = [
    { query: 'DMT laser protocol evidence', intent: 'informational', page: '/evidence-map' },
    { query: '650nm laser for DMT', intent: 'transactional', page: '/prepare' },
    { query: 'ketamine assisted therapy protocol', intent: 'informational', page: '/protocols/ketamine-spravato' },
    { query: 'DMT symbol database download', intent: 'transactional', page: '/dataset' },
    { query: 'psychedelic voice logger app', intent: 'navigational', page: '/log' },
    { query: 'Goler 2025 DMT study', intent: 'informational', page: '/bibliography' },
    { query: 'DMT trip report journal', intent: 'transactional', page: '/prepare' },
    { query: 'psilocybin therapy guide', intent: 'informational', page: '/protocols/psilocybin' },
    { query: 'diffraction grating DMT', intent: 'transactional', page: '/prepare' },
    { query: 'DMT replication study', intent: 'informational', page: '/methods' },
  ];

  const budgetTactics = [
    { tactic: 'UGC voice logs', cost: '$0', description: '200-800 logs = unique content moat' },
    { tactic: 'Reddit/Nexus seeding', cost: '$0', description: 'Manual posts in r/DMT, DMT-Nexus' },
    { tactic: 'Dataset on Zenodo', cost: '$0', description: 'Academic citations + backlinks' },
    { tactic: 'JSON-LD schemas', cost: '$0', description: 'AI slurping + rich snippets' },
    { tactic: 'llms.txt file', cost: '$0', description: 'Direct AI crawler instructions' },
    { tactic: 'GSC submission', cost: '$0', description: 'Immediate indexing of the sitemap' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Static guidance — not measured data.</span>{' '}
            Nothing on this tab is a live metric. These are target queries and tactics written by the operator. For
            measured crawler data see the GEO/AEO and SEO tabs.
          </p>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold">Niche GEO guidance</h2>

      <Tabs defaultValue="queries" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="queries">Target queries</TabsTrigger>
          <TabsTrigger value="tactics">Tactics</TabsTrigger>
          <TabsTrigger value="gaps">Open items</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Target queries</CardTitle>
              <CardDescription>
                Queries the operator intends this site to answer, with the page each one is written for. Not a coverage
                measurement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nicheQueries.map((q, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">"{q.query}"</p>
                        <p className="text-xs text-muted-foreground">{q.page}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="self-start text-xs sm:self-auto">
                      {q.intent}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tactics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tactics</CardTitle>
              <CardDescription>Zero-cost strategies the operator has chosen to pursue.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetTactics.map((t, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{t.tactic}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="self-start sm:self-auto">
                      {t.cost}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open items</CardTitle>
              <CardDescription>Operator to-do list. Status here is written by hand, not detected.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Reddit/Nexus CTAs</p>
                    <p className="text-sm text-muted-foreground">
                      Add "Share to r/DMT" and "Post to DMT-Nexus" buttons on /log analysis pages. Manual seeding needed
                      initially for community traction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Voice log preview images</p>
                    <p className="text-sm text-muted-foreground">
                      Generate OG images for voice log analysis pages for social sharing. Current: placeholder images.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Search Console and Dataset Search submission</p>
                    <p className="text-sm text-muted-foreground">
                      Submit the sitemap to Google Search Console and Google Dataset Search. For the live sitemap entry
                      count, run the checks on the Content tab.
                    </p>
                    <Button variant="link" className="mt-1 h-auto p-0" asChild>
                      <a href="https://search.google.com/search-console" target="_blank" rel="noopener">
                        Open GSC <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NicheGeoAudit;
