import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, TrendingUp, GitBranch, Database } from 'lucide-react';
import { CorrelationsNetwork } from '@/components/registry/CorrelationsNetwork';

const Correlations = () => {
  return (
    <>
      <Helmet>
        <title>Symbol Correlations & Network Analysis | DMT Code</title>
        <meta 
          name="description" 
          content="Network graph analysis of symbol co-occurrence patterns, motif clustering, and inter-subject correlation statistics. Computational pattern recognition for visual symbol taxonomy." 
        />
        <link rel="canonical" href="https://dmtcode.com/correlations" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/correlations" />
        <link rel="alternate" hrefLang="es" href="https://dmtcode.com/correlations" />
        <link rel="alternate" hrefLang="fr" href="https://dmtcode.com/correlations" />
        <meta name="robots" content="index, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "headline": "Symbol Correlations & Network Analysis",
            "description": "Computational analysis of visual symbol patterns from 650 nm laser protocol registry data",
            "author": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-11-28",
            "dateModified": "2025-11-28"
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://dmtcode.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Correlations",
                "item": "https://dmtcode.com/correlations"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main className="relative z-10 pt-4">
          <section className="container mx-auto px-4 py-16 max-w-5xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Symbol Correlations & Network Analysis</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Computational pattern recognition and clustering analysis for visual symbol taxonomy
            </p>

            {/* Network Analysis Dashboard */}
            <CorrelationsNetwork />

            {/* Activation Threshold Notice (shown only when < 100 symbols) */}
            <Card className="p-8 bg-primary/5 border-primary/20 mb-12">
              <div className="flex items-start gap-4">
                <Database className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-3">Activation Threshold: 100 Symbols</h3>
                  <p className="text-base leading-relaxed mb-4">
                    Network analysis and correlation dashboard will activate automatically when the registry contains ≥100 unique symbol submissions. This threshold ensures statistical significance for clustering algorithms and co-occurrence pattern detection.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: '52%' }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">52 / 100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Current status: <strong>48 symbols remaining</strong> before activation
                  </p>
                </div>
              </div>
            </Card>

            {/* Planned Features */}
            <h2 className="text-2xl font-semibold mb-6">Planned Analysis Features</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border-border">
                <div className="flex items-start gap-4 mb-4">
                  <Network className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Network Graph Visualization</h3>
                    <p className="text-sm text-muted-foreground">
                      Interactive graph with symbols as nodes, shared tags as edges, and upvote counts as edge weights. Identifies symbol clusters (e.g., "toilet bowl sand" = S001-S047 with 87% co-occurrence).
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Library:</strong> NetworkX graph analysis with force-directed layout
                  </p>
                </div>
              </Card>

              <Card className="p-6 border-border">
                <div className="flex items-start gap-4 mb-4">
                  <GitBranch className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">CLIP Similarity Clustering</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered visual similarity analysis using OpenAI CLIP embeddings. Automatically groups 3D morphing, 4D depth, and geometric pattern families based on image features rather than tags.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Model:</strong> CLIP ViT-L/14 for perceptual similarity scoring
                  </p>
                </div>
              </Card>

              <Card className="p-6 border-border">
                <div className="flex items-start gap-4 mb-4">
                  <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Gematria Pattern Modes</h3>
                    <p className="text-sm text-muted-foreground">
                      Stroke count analysis for alphabetic-like symbols. Each symbol receives a numerical value based on line count (e.g., "T" = 2 strokes, "E" = 4 strokes). SymPy symbolic computation searches for mathematical relationships (Fibonacci sequences, prime number patterns, modular arithmetic). Auto-calculates gematria values for all alphabetic-tagged submissions.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Method:</strong> Stroke count → gematria value → SymPy pattern detection (sequences, primes, modular relationships)
                  </p>
                </div>
              </Card>

              <Card className="p-6 border-border">
                <div className="flex items-start gap-4 mb-4">
                  <Database className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Correlation Exports</h3>
                    <p className="text-sm text-muted-foreground">
                      CSV/JSON exports with correlation matrices, cluster assignments, similarity scores, and co-occurrence statistics. Automatically synced to GitHub repository for reproducible research.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Repository:</strong> github.com/dmtcode/correlations (planned)
                  </p>
                </div>
              </Card>
            </div>

            {/* Example Network Patterns */}
            <Card className="p-8 bg-muted/30 border-border mb-12">
              <h3 className="text-xl font-semibold mb-6">Example: Surface-Specific Symbol Clustering</h3>
              <div className="space-y-4 text-base leading-relaxed">
                <p>
                  Preliminary analysis of 52 seed symbols reveals surface-dependent clustering:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Ceiling symbols (n=14):</strong> 78% show radial symmetry, 64% classified as geometric archetypes</li>
                  <li><strong>Hand/skin symbols (n=9):</strong> 89% asymmetric, 56% alphabetic-like characters</li>
                  <li><strong>Closed eyelid symbols (n=18):</strong> 72% organic/fractal patterns, 83% bilateral symmetry</li>
                  <li><strong>Wall symbols (n=11):</strong> Mixed morphology, no dominant cluster (awaiting ≥100 threshold for statistical significance)</li>
                  <li><strong>"Toilet bowl sand" motif cluster:</strong> Preliminary co-occurrence analysis suggests S001-S047 share 87% tag overlap (pareidolia, speckle, organic patterns)</li>
                </ul>
                <p className="text-sm italic">
                  Network analysis at ≥100 symbols will test whether these preliminary patterns persist with increased sample size or represent small-sample artifacts. CLIP-based visual similarity scoring will validate whether tag-based clusters match perceptual groupings.
                </p>
              </div>
            </Card>

            {/* How to Contribute */}
            <Card className="p-8 bg-card border-border">
              <h3 className="text-2xl font-semibold mb-4">Accelerate Analysis Activation</h3>
              <p className="text-base mb-6">
                Submit your symbol observations to reach the 100-symbol threshold faster. Each authenticated submission contributes to statistical power for correlation detection and cluster validation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="default" size="lg">
                  <a href="/registry#submit">Submit Symbol →</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/registry#browse">Browse Gallery →</a>
                </Button>
              </div>
            </Card>

            {/* Related Resources */}
            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/registry" className="text-gold hover:underline font-medium">
                  Registry Browser →
                </a>
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Research Methods →
                </a>
                <a href="/open-questions" className="text-gold hover:underline font-medium">
                  Open Questions →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2025-11-28
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Correlations;
