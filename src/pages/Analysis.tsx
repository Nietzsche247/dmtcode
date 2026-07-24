import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileJson, BookOpen, Compass } from 'lucide-react';

const Analysis = () => {
  return (
    <>
      <Helmet>
        <title>Open Data | DMT Code Corpus</title>
        <meta
          name="description"
          content="The DMT Code corpus is published as a machine-readable export under CC BY 4.0. Includes clinical trial records, bibliography sources, symbol submissions, open theories, and events."
        />
        <link rel="canonical" href="https://dmtcode.com/analysis" />
        <meta name="robots" content="index, follow" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": "DMT Code Open Corpus",
            "description": "Machine-readable export of the DMT Code corpus covering clinical trial records, bibliography sources, symbol submissions, open theories, and events.",
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "distribution": [
              {
                "@type": "DataDownload",
                "encodingFormat": "application/json",
                "contentUrl": "https://dmtcode.com/data.json"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main className="relative z-10 pt-4">
          <section className="container mx-auto px-4 py-16 max-w-4xl text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Database className="w-3 h-3 mr-1" />
              OPEN DATA
            </Badge>

            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              THE CORPUS IS
              <span className="block text-primary">OPEN DATA</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The full DMT Code corpus is published as a machine-readable export under a
              Creative Commons Attribution 4.0 license. Researchers are welcome to build
              their own analyses and visualizations on top of it.
            </p>
          </section>

          <section className="container mx-auto px-4 pb-12 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card border-border">
                <FileJson className="w-8 h-8 text-primary mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  <a href="/data.json" className="hover:text-primary transition-colors">
                    /data.json
                  </a>
                </h2>
                <p className="text-sm text-muted-foreground">
                  The complete export in JSON. A single file suitable for scripting,
                  notebooks, and downstream analysis.
                </p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <BookOpen className="w-8 h-8 text-primary mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  <a href="/llms.txt" className="hover:text-primary transition-colors">
                    /llms.txt
                  </a>
                </h2>
                <p className="text-sm text-muted-foreground">
                  A machine-readable index of the site aimed at language models and
                  research agents.
                </p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <Compass className="w-8 h-8 text-primary mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  <a href="/dataset" className="hover:text-primary transition-colors">
                    /dataset
                  </a>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Dataset landing page with citation guidance and licensing details.
                </p>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-12 max-w-4xl">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-2xl font-semibold mb-4">What the export contains</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The corpus is organized as categories rather than fixed counts, since
                records are added and revised over time.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Clinical trial records tracked from public registries.</li>
                <li>Bibliography sources with DOIs and links to primary literature.</li>
                <li>Symbol submissions contributed by community observers.</li>
                <li>Open theories with attribution and provenance.</li>
                <li>Events and retreats relevant to the research programme.</li>
              </ul>
            </Card>
          </section>

          <section className="container mx-auto px-4 pb-16 max-w-4xl">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                ROADMAP
              </Badge>
              <h2 className="text-2xl font-semibold mb-3">Clustering and similarity views</h2>
              <p className="text-sm text-muted-foreground">
                Dimensionality reduction and similarity visualizations are not built yet.
                They are planned as a follow-on once the symbol corpus is large enough to
                support them. Until then, the export above is the source of truth, and
                researchers are encouraged to prototype their own views on it.
              </p>
            </Card>
          </section>

          <section className="container mx-auto px-4 pb-16 max-w-4xl">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold mb-2">License</h2>
              <p className="text-sm text-muted-foreground">
                The DMT Code corpus is released under{' '}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Creative Commons Attribution 4.0 International
                </a>
                . You may share and adapt the data for any purpose, including commercial
                use, provided you attribute the source.
              </p>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Analysis;
