import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeoAeoInsights } from './GeoAeoInsights';
import { ContentAuditor } from './ContentAuditor';
import { CompetitorSpy } from './CompetitorSpy';
import { SeoInsights } from './SeoInsights';
import { OnPageAuditor } from './OnPageAuditor';
import { ConversionFunnel } from './ConversionFunnel';

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
        <Tabs defaultValue="geo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="geo">GEO/AEO</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="competitor">Competitors</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
          </TabsList>

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

          <TabsContent value="funnel" className="space-y-4">
            <ConversionFunnel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
