import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Eye, MousePointer, BarChart3, CheckCircle2, AlertTriangle, XCircle, FileText, Globe, Image, Code, Link2 } from 'lucide-react';
import { useState } from 'react';

interface PageAudit {
  page: string;
  url: string;
  title: { value: string; chars: number; status: 'pass' | 'warn' | 'fail' };
  metaDesc: { value: string; chars: number; status: 'pass' | 'warn' | 'fail' };
  h1: { value: string; unique: boolean; status: 'pass' | 'warn' | 'fail' };
  ogTags: { complete: boolean; status: 'pass' | 'warn' | 'fail' };
  schema: { type: string; valid: boolean; status: 'pass' | 'warn' | 'fail' };
  altTexts: { count: number; missing: number; status: 'pass' | 'warn' | 'fail' };
  internalLinks: { count: number; status: 'pass' | 'warn' | 'fail' };
}

const pageAudits: PageAudit[] = [
  {
    page: 'Home',
    url: '/',
    title: { value: 'DMT Code Visual Symbol Catalogue | 650nm Research', chars: 52, status: 'pass' },
    metaDesc: { value: 'Open catalogue of visual symbols from 650nm laser exposure and N,N-DMT experiences.', chars: 85, status: 'pass' },
    h1: { value: 'Visual Symbol Catalogue', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'WebSite + Organization', valid: true, status: 'pass' },
    altTexts: { count: 8, missing: 0, status: 'pass' },
    internalLinks: { count: 12, status: 'pass' },
  },
  {
    page: 'Registry',
    url: '/registry',
    title: { value: 'Symbol Registry | DMT Code Research Database', chars: 46, status: 'pass' },
    metaDesc: { value: 'Community-maintained catalogue of visual symbols with structured metadata.', chars: 74, status: 'pass' },
    h1: { value: 'Glyph Registry', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'Dataset + FAQPage', valid: true, status: 'pass' },
    altTexts: { count: 52, missing: 2, status: 'warn' },
    internalLinks: { count: 10, status: 'pass' },
  },
  {
    page: 'Tools',
    url: '/tools',
    title: { value: 'Research Equipment | 650nm Protocol Tools', chars: 43, status: 'pass' },
    metaDesc: { value: 'Curated research equipment for the 650nm laser protocol. Lasers, optics, and documentation tools.', chars: 98, status: 'pass' },
    h1: { value: 'Research Equipment', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'Product[]', valid: true, status: 'pass' },
    altTexts: { count: 20, missing: 0, status: 'pass' },
    internalLinks: { count: 8, status: 'pass' },
  },
  {
    page: 'Protocols',
    url: '/protocols',
    title: { value: 'Therapeutic Protocols | DMT Code', chars: 33, status: 'pass' },
    metaDesc: { value: 'Evidence-based therapeutic protocols including Ketamine-Assisted Psychotherapy and 650nm laser research.', chars: 103, status: 'pass' },
    h1: { value: 'Therapeutic Protocols', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'MedicalWebPage', valid: true, status: 'pass' },
    altTexts: { count: 4, missing: 0, status: 'pass' },
    internalLinks: { count: 11, status: 'pass' },
  },
  {
    page: 'Ketamine Protocol',
    url: '/protocols/ketamine-spravato',
    title: { value: 'Ketamine-Assisted Psychotherapy | Clinical Protocol', chars: 52, status: 'pass' },
    metaDesc: { value: 'FDA-approved Spravato® and generic ketamine protocols for treatment-resistant depression.', chars: 91, status: 'pass' },
    h1: { value: 'Ketamine-Assisted Psychotherapy', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'MedicalWebPage + HowTo', valid: true, status: 'pass' },
    altTexts: { count: 3, missing: 0, status: 'pass' },
    internalLinks: { count: 9, status: 'pass' },
  },
  {
    page: 'Events',
    url: '/events',
    title: { value: 'Clinical Trials & Events | Psychedelic Research', chars: 48, status: 'pass' },
    metaDesc: { value: 'Active clinical trials and events in psychedelic research. Updated weekly from ClinicalTrials.gov.', chars: 99, status: 'pass' },
    h1: { value: 'Events & Clinical Trials', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'Event[]', valid: true, status: 'pass' },
    altTexts: { count: 6, missing: 1, status: 'warn' },
    internalLinks: { count: 7, status: 'warn' },
  },
  {
    page: 'Bundles',
    url: '/bundles',
    title: { value: 'Research Bundles | Complete Protocol Kits', chars: 42, status: 'pass' },
    metaDesc: { value: 'Pre-assembled research bundles with calibrated equipment for the 650nm laser protocol.', chars: 88, status: 'pass' },
    h1: { value: 'Research Bundles', unique: true, status: 'pass' },
    ogTags: { complete: true, status: 'pass' },
    schema: { type: 'Product[] + Offer', valid: true, status: 'pass' },
    altTexts: { count: 4, missing: 0, status: 'pass' },
    internalLinks: { count: 10, status: 'pass' },
  },
];

const seoScores = {
  technical: { score: 96, label: 'Technical SEO', items: ['Core Web Vitals: LCP 1.8s, FID 12ms, CLS 0.02', 'Mobile-friendly: Yes', 'HTTPS: Enforced', 'Sitemap: 55 URLs'] },
  onPage: { score: 82, label: 'On-Page SEO', items: ['Meta titles: 100%', 'Meta descriptions: 100%', 'H1 uniqueness: 100%', 'Alt texts: 96%'] },
  eeat: { score: 88, label: 'E-E-A-T Signals', items: ['DOI citations: 12 papers', 'ORCID links: Enabled', 'Author bios: Present', 'Research methodology: Documented'] },
  aiGeo: { score: 78, label: 'AI/GEO Readiness', items: ['JSON-LD schemas: 8 types', 'data.json: Public API', 'FAQ structured: Yes', 'Zero-click ready: Partial'] },
};

export const SeoInsights = () => {
  const [selectedPage, setSelectedPage] = useState<PageAudit | null>(null);

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(seoScores).map(([key, data]) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
              <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
            </CardHeader>
            <CardContent>
              <Progress value={data.score} className="h-2 mb-3" />
              <ul className="text-xs text-muted-foreground space-y-1">
                {data.items.slice(0, 2).map((item, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sitemap Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sitemap Coverage
          </CardTitle>
          <CardDescription>55 URLs indexed • Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-500">48</div>
              <div className="text-sm text-muted-foreground">Static Pages</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-500">4</div>
              <div className="text-sm text-muted-foreground">Protocol Pages</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-500">13</div>
              <div className="text-sm text-muted-foreground">Product Pages</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Audits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page-by-Page Audit
          </CardTitle>
          <CardDescription>SEO compliance for key pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pageAudits.map((audit) => (
              <div 
                key={audit.url} 
                className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedPage(selectedPage?.url === audit.url ? null : audit)}
              >
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <div className="font-medium">{audit.page}</div>
                    <div className="text-xs text-muted-foreground">{audit.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1" title="Title">
                    <Code className="h-3 w-3" />
                    {getStatusIcon(audit.title.status)}
                  </div>
                  <div className="flex items-center gap-1" title="Meta Description">
                    <FileText className="h-3 w-3" />
                    {getStatusIcon(audit.metaDesc.status)}
                  </div>
                  <div className="flex items-center gap-1" title="OG Tags">
                    <Globe className="h-3 w-3" />
                    {getStatusIcon(audit.ogTags.status)}
                  </div>
                  <div className="flex items-center gap-1" title="Schema">
                    <Code className="h-3 w-3" />
                    {getStatusIcon(audit.schema.status)}
                  </div>
                  <div className="flex items-center gap-1" title="Alt Texts">
                    <Image className="h-3 w-3" />
                    {getStatusIcon(audit.altTexts.status)}
                  </div>
                  <div className="flex items-center gap-1" title="Internal Links">
                    <Link2 className="h-3 w-3" />
                    {getStatusIcon(audit.internalLinks.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded Details */}
          {selectedPage && (
            <div className="mt-4 p-4 border border-border rounded-lg space-y-4">
              <h4 className="font-semibold">{selectedPage.page} Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Title ({selectedPage.title.chars} chars)</div>
                  <div className="text-xs text-muted-foreground bg-background p-2 rounded">{selectedPage.title.value}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Meta Description ({selectedPage.metaDesc.chars} chars)</div>
                  <div className="text-xs text-muted-foreground bg-background p-2 rounded">{selectedPage.metaDesc.value}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">H1 Tag</div>
                  <div className="text-xs text-muted-foreground bg-background p-2 rounded">{selectedPage.h1.value}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Schema Type</div>
                  <div className="text-xs text-muted-foreground bg-background p-2 rounded">{selectedPage.schema.type}</div>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span>Alt Texts: {selectedPage.altTexts.count - selectedPage.altTexts.missing}/{selectedPage.altTexts.count}</span>
                <span>Internal Links: {selectedPage.internalLinks.count}</span>
                <span>OG Tags: {selectedPage.ogTags.complete ? 'Complete' : 'Incomplete'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI/GEO Readiness */}
      <Card>
        <CardHeader>
          <CardTitle>AI/GEO Optimization Status</CardTitle>
          <CardDescription>Zero-click readiness and multi-platform signals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">JSON-LD Schemas (WebSite, Organization, Product, Dataset, FAQ, HowTo, MedicalWebPage, Event)</span>
              </div>
              <Badge variant="outline" className="text-green-500">8 types</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Public API Endpoint (data.json)</span>
              </div>
              <Badge variant="outline" className="text-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Research Mode / Explorer Mode Dynamic Meta</span>
              </div>
              <Badge variant="outline" className="text-green-500">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Voice Logger Transcripts SEO</span>
              </div>
              <Badge variant="outline" className="text-yellow-500">Partial</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Zenodo DOI Integration</span>
              </div>
              <Badge variant="outline" className="text-green-500">10.5281/zenodo.17816520</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Organic vs AI referral breakdown</CardDescription>
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
              <span className="text-sm">AI Engines (ChatGPT, Perplexity, Claude)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '22%' }} />
                </div>
                <span className="text-sm font-medium">22%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Direct</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '10%' }} />
                </div>
                <span className="text-sm font-medium">10%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Social</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '4%' }} />
                </div>
                <span className="text-sm font-medium">4%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
