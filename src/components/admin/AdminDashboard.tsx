import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeoAeoInsights } from './GeoAeoInsights';
import { ContentAuditor } from './ContentAuditor';
import { CompetitorSpy } from './CompetitorSpy';
import { SeoInsights } from './SeoInsights';
import { OnPageAuditor } from './OnPageAuditor';
import { ConversionFunnel } from './ConversionFunnel';
import { SymbolModeration } from './SymbolModeration';
import { SymbolSubmissionModeration } from './SymbolSubmissionModeration';
import { NullDashboard } from './NullDashboard';
import { AdminNotifications } from './AdminNotifications';
import { ScraperStatus } from './ScraperStatus';
import { ProductModeration } from './ProductModeration';
import { BundleAnalytics } from './BundleAnalytics';
import { GA4DebugTester } from './GA4DebugTester';
import { GA4KeyEventChecklist } from './GA4KeyEventChecklist';
import { RepoCloneButton } from './RepoCloneButton';
import { NicheGeoAudit } from './NicheGeoAudit';
import { ApiAccessLog } from './ApiAccessLog';
import { ForecastChangelog } from './ForecastChangelog';

export const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold glow-text">DMT Code Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive GEO/AEO tracking and analytics
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="niche-geo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-14">
            <TabsTrigger value="niche-geo">🎯 Niche GEO</TabsTrigger>
            <TabsTrigger value="alerts">🔔 Alerts</TabsTrigger>
            <TabsTrigger value="forecasts">📈 Forecasts</TabsTrigger>
            <TabsTrigger value="symbols">Symbols</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="bundles">📊 Bundles</TabsTrigger>
            <TabsTrigger value="nulls">Null Reports</TabsTrigger>
            <TabsTrigger value="scraper">Scraper</TabsTrigger>
            <TabsTrigger value="api-log">📡 API Log</TabsTrigger>
            <TabsTrigger value="geo">GEO/AEO</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="competitor">Competitors</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="niche-geo" className="space-y-4">
            <NicheGeoAudit />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-4">
            <ForecastChangelog />
          </TabsContent>

          <TabsContent value="symbols" className="space-y-4">
            <Tabs defaultValue="submissions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="submissions">User Submissions</TabsTrigger>
                <TabsTrigger value="registry">Registry Glyphs</TabsTrigger>
              </TabsList>
              <TabsContent value="submissions">
                <SymbolSubmissionModeration />
              </TabsContent>
              <TabsContent value="registry">
                <SymbolModeration />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductModeration />
          </TabsContent>

          <TabsContent value="bundles" className="space-y-4">
            <RepoCloneButton />
            <GA4DebugTester />
            <GA4KeyEventChecklist />
            <BundleAnalytics />
          </TabsContent>

          <TabsContent value="nulls" className="space-y-4">
            <NullDashboard />
          </TabsContent>

          <TabsContent value="scraper" className="space-y-4">
            <ScraperStatus />
          </TabsContent>

          <TabsContent value="api-log" className="space-y-4">
            <ApiAccessLog />
          </TabsContent>

          <TabsContent value="geo" className="space-y-4">
            <GeoAeoInsights />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentAuditor />
          </TabsContent>

          <TabsContent value="competitor" className="space-y-4">
            <CompetitorSpy />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <SeoInsights />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <OnPageAuditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
