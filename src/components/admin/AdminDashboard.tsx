import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeoAeoInsights } from './GeoAeoInsights';
import { ContentAuditor } from './ContentAuditor';
import { SeoInsights } from './SeoInsights';
import { ConversionFunnel } from './ConversionFunnel';
import { SymbolModeration } from './SymbolModeration';
import { SymbolSubmissionModeration } from './SymbolSubmissionModeration';
import { NullDashboard } from './NullDashboard';
import { AdminNotifications } from './AdminNotifications';
import { ScraperStatus } from './ScraperStatus';
import { ScraperRunHistory } from './ScraperRunHistory';
import { TrialsBackfillPanel } from './TrialsBackfillPanel';
import { ProductModeration } from './ProductModeration';
import { BundleAnalytics } from './BundleAnalytics';
import { GA4DebugTester } from './GA4DebugTester';
import { GA4KeyEventChecklist } from './GA4KeyEventChecklist';
import { RepoCloneButton } from './RepoCloneButton';
import { DeployButton } from './DeployButton';

import { NicheGeoAudit } from './NicheGeoAudit';
import { ApiAccessLog } from './ApiAccessLog';
import { ForecastChangelog } from './ForecastChangelog';
import { VolunteersModeration } from './VolunteersModeration';
import { BibliographyReviewQueue } from './BibliographyReviewQueue';
import { ArticleLeadsQueue } from './ArticleLeadsQueue';
import { ArticlesManager } from './ArticlesManager';
import { CrawlerIntelligence } from './CrawlerIntelligence';
import { KitSignups } from './KitSignups';
import { GA4Analytics } from './GA4Analytics';
import { IntelHub } from './IntelHub';
import { TrendsTracker } from './TrendsTracker';

import { MembersDirectory } from './MembersDirectory';
import { PreregistrationQueue } from './PreregistrationQueue';
import { WaitlistPanel } from './WaitlistPanel';
import { DoorTapsPanel } from './DoorTapsPanel';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

export const AdminDashboard = () => {
  const { loading, isAdmin, isModerator } = useRoles();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Reviewers (moderators) get a narrowed console: review queues only, no
  // analytics, no volunteer records, no deploy controls, no deletion.
  if (!isAdmin && isModerator) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Review console</h1>
            <p className="text-muted-foreground mt-2">
              Symbol submissions and article leads. Your decisions are logged and reversible by an administrator.
            </p>
            <Link to="/volunteer" className="text-sm underline mt-2 inline-block">
              Your volunteer dashboard
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Tabs defaultValue="symbols" className="space-y-6">
            <TabsList>
              <TabsTrigger value="symbols">Symbol submissions</TabsTrigger>
              <TabsTrigger value="leads">Article leads</TabsTrigger>
            </TabsList>
            <TabsContent value="symbols" className="space-y-4">
              <SymbolSubmissionModeration />
            </TabsContent>
            <TabsContent value="leads" className="space-y-4">
              <ArticleLeadsQueue />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold glow-text">DMT Code Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive GEO/AEO tracking and analytics
          </p>
          <div className="mt-6">
            <DeployButton />
          </div>
        </div>
      </div>




      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="niche-geo" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="intel">Intel</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>

            <TabsTrigger value="niche-geo">Niche GEO</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>

            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="intake">Intake</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="symbols">Symbols</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="nulls">Null Reports</TabsTrigger>
            <TabsTrigger value="scraper">Scraper</TabsTrigger>
            <TabsTrigger value="api-log">API Log</TabsTrigger>
            <TabsTrigger value="crawlers">Crawlers</TabsTrigger>
            <TabsTrigger value="funnel">Engagement</TabsTrigger>
            <TabsTrigger value="geo">GEO/AEO</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="intel" className="space-y-4">
            <IntelHub />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <TrendsTracker />
          </TabsContent>


          <TabsContent value="articles" className="space-y-4">
            <ArticlesManager />
          </TabsContent>



          <TabsContent value="niche-geo" className="space-y-4">
            <NicheGeoAudit />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <GA4Analytics />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-4">
            <ForecastChangelog />
          </TabsContent>

          <TabsContent value="volunteers" className="space-y-4">
            <VolunteersModeration />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MembersDirectory />
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
            <KitSignups />
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
            <ScraperRunHistory />
            <TrialsBackfillPanel />
            <ArticleLeadsQueue />
            <BibliographyReviewQueue />
          </TabsContent>

          <TabsContent value="api-log" className="space-y-4">
            <ApiAccessLog />
          </TabsContent>

          <TabsContent value="crawlers" className="space-y-4">
            <CrawlerIntelligence />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <ConversionFunnel />
          </TabsContent>




          <TabsContent value="geo" className="space-y-4">
            <GeoAeoInsights />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentAuditor />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <SeoInsights />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
