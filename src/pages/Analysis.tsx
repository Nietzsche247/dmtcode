import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, Maximize2, BarChart3, Network, Layers } from 'lucide-react';
import { useState } from 'react';

const Analysis = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Observable notebook embed URL - replace with actual notebook when created
  const observableEmbedUrl = 'https://observablehq.com/embed/@d3/gallery?cells=chart';
  
  // Alternative: Custom t-SNE visualization notebook
  const customNotebookUrl = 'https://observablehq.com/embed/d/abc123?cells=tsneChart,clusterLegend';

  const handleFullscreen = () => {
    const iframe = document.getElementById('observable-embed') as HTMLIFrameElement;
    if (iframe) {
      iframe.requestFullscreen?.();
    }
    setIsFullscreen(true);
  };

  const handleExportPNG = () => {
    // Trigger export via postMessage to Observable
    const iframe = document.getElementById('observable-embed') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'export', format: 'png' }, '*');
    }
  };

  return (
    <>
      <Helmet>
        <title>Symbol Analysis | t-SNE Clustering | DMT Code</title>
        <meta 
          name="description" 
          content="Interactive t-SNE dimensionality reduction visualization of DMT Code symbol clusters. Explore patterns by consistency, tags, and sources." 
        />
        <link rel="canonical" href="https://dmtcode.com/analysis" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "DMT Code Symbol Analysis",
            "description": "Interactive t-SNE visualization of visual symbol clusters from the DMT Code registry",
            "applicationCategory": "DataVisualization",
            "operatingSystem": "Web",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            }
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <BarChart3 className="w-3 h-3 mr-1" />
              INTERACTIVE VISUALIZATION
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              SYMBOL CLUSTER
              <span className="block text-primary">ANALYSIS</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              t-SNE dimensionality reduction of visual symbol features. Explore emergent clusters 
              by consistency rating, motif tags, and observation source.
            </p>

            <div className="flex justify-center gap-4 flex-wrap mb-12">
              <Button 
                variant="outline" 
                onClick={handleFullscreen}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </Button>
              <Button 
                variant="outline"
                onClick={handleExportPNG}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export PNG
              </Button>
              <a 
                href="https://observablehq.com/@dmtcode/symbol-tsne" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open in Observable
                </Button>
              </a>
            </div>
          </section>

          {/* Observable Embed */}
          <section className="container mx-auto px-4 pb-16">
            <Card className="overflow-hidden border-primary/20 bg-card">
              <div className="relative w-full" style={{ height: '700px' }}>
                <iframe
                  id="observable-embed"
                  width="100%"
                  height="700"
                  frameBorder="0"
                  src={observableEmbedUrl}
                  title="t-SNE Symbol Cluster Visualization"
                  className="bg-background"
                  allow="fullscreen"
                  loading="lazy"
                ></iframe>
                
                {/* Fallback for when Observable doesn't load */}
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none opacity-0 transition-opacity" id="embed-fallback">
                  <div className="text-center p-8">
                    <Network className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading visualization...</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Method Explanation */}
          <section className="container mx-auto px-4 pb-16">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border-border">
                <Layers className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">t-SNE Algorithm</h3>
                <p className="text-sm text-muted-foreground">
                  t-Distributed Stochastic Neighbor Embedding reduces high-dimensional symbol features 
                  to 2D while preserving local structure. Similar symbols cluster together.
                </p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <BarChart3 className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Feature Extraction</h3>
                <p className="text-sm text-muted-foreground">
                  Symbols encoded by: motif tags (geometric, alphabetic), symmetry type, 
                  observation source, surface texture, and inter-subject consistency scores.
                </p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <Network className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Live Data</h3>
                <p className="text-sm text-muted-foreground">
                  Visualization pulls directly from <code className="text-primary">/data.json</code> endpoint. 
                  New submissions appear in clusters after page refresh.
                </p>
              </Card>
            </div>
          </section>

          {/* Color Legend */}
          <section className="container mx-auto px-4 pb-16">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4">Cluster Color Legend</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">650nm Laser (High Consistency)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Closed Eyes DMT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Geometric Patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Alphabetic/Letter-like</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Spiral/Radial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Untagged/Other</span>
                </div>
              </div>
            </Card>
          </section>

          {/* API Endpoint Info */}
          <section className="container mx-auto px-4 pb-16">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="text-lg font-semibold mb-4">Programmatic Access</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Access filtered symbol data via the public API for your own visualizations:
              </p>
              <div className="bg-background p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code className="text-primary">GET /api/symbols?tag=helix,spiral&source=650nm_laser&consistency=gte:80&limit=100</code>
              </div>
              <div className="mt-4 flex gap-4">
                <a href="/api/symbols" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    View Raw API
                  </Button>
                </a>
                <a href="/data.json" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Full Dataset (JSON)
                  </Button>
                </a>
              </div>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Analysis;