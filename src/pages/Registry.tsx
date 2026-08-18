import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
import { RegistryHero } from '@/components/registry/RegistryHero';
import { RegistryRationale } from '@/components/registry/RegistryRationale';
import { RegistryStatistics } from '@/components/registry/RegistryStatistics';
import { LayeredSubmissionForm } from '@/components/registry/LayeredSubmissionForm';
import { RegistryBrowser } from '@/components/registry/RegistryBrowser';
import { RegistryDownloads } from '@/components/registry/RegistryDownloads';
import { RegistryResources } from '@/components/registry/RegistryResources';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';

interface DrawnGlyph {
  id: string;
  image_data: string;
  source: string | null;
  created_at: string | null;
}

const DrawnGlyphReports = () => {
  const [glyphs, setGlyphs] = useState<DrawnGlyph[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from('registry_glyphs')
        .select('id, image_data, source, created_at')
        .order('created_at', { ascending: false });
      if (!active) return;
      // Every row in the table is counted, including any whose drawing data is
      // missing and cannot be rendered. A row that will not display is still a
      // submission somebody made, so the shortfall is stated in public rather
      // than quietly dropped out of the total.
      setTotalRows((data || []).length);
      const rows = (data || []).filter(
        (r): r is DrawnGlyph => typeof r.image_data === 'string' && r.image_data.length > 0
      );
      setGlyphs(rows);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (glyphs.length === 0) return null;

  const missing = totalRows - glyphs.length;

  return (
    <section className="container mx-auto px-4 py-12 max-w-6xl" aria-labelledby="drawn-glyph-reports">
      <h2 id="drawn-glyph-reports" className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
        Drawn glyph reports
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl mb-8">
        These are {glyphs.length} anonymous freehand drawings submitted through the registry's drawing tool,
        shown unedited and uncurated.
        {missing > 0 && (
          <>
            {' '}
            The table holds {totalRows} rows in total.{' '}
            {missing === 1
              ? 'One of them stored no drawing data and cannot be rendered, so it is counted here but not shown.'
              : `${missing} of them stored no drawing data and cannot be rendered, so they are counted here but not shown.`}
          </>
        )}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {glyphs.map((g) => (
          <article key={g.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <img
              src={g.image_data.startsWith('data:') ? g.image_data : `data:image/png;base64,${g.image_data}`}
              alt="Anonymous freehand glyph drawing submitted to the registry"
              loading="lazy"
              className="w-full aspect-square object-contain bg-background"
            />
            <div className="p-3 flex flex-wrap items-center gap-2">
              {g.source ? (
                <Badge variant="secondary" className="text-xs">
                  {g.source.replace(/_/g, ' ')}
                </Badge>
              ) : null}
              {g.created_at ? (
                <span className="text-xs text-muted-foreground">
                  {new Date(g.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const Registry = () => {
  const navigate = useNavigate();
  return (

    <>
      <SEO uiKey="registry" path="/registry" />
      <Helmet>
        <meta name="keywords" content="DMT glyphs, 650nm laser, visual symbols, N,N-DMT administration, psychedelic research, scientific catalogue, open data, CC-BY-4.0, null reports, baseline data" />

        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/registry" />
        <meta name="twitter:title" content="DMT Code Visual Symbol Registry: Open Catalogue (CC-BY-4.0)" />
        <meta name="twitter:description" content="Browse the open catalogue of visual forms reported during N,N-DMT experiences, with structured metadata and free CC-BY-4.0 data." />
        <meta name="twitter:image" content="https://dmtcode.com/og-image.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Dataset",
                "@id": "https://dmtcode.com/registry",
                "name": "DMT Code Visual Symbol Registry",
                "description": "Open catalogue of discrete visual forms reported in connection with N,N-DMT experiences.",
                "url": "https://dmtcode.com/registry",
                "license": "https://creativecommons.org/licenses/by/4.0/",
                "creator": { "@type": "Organization", "name": "DMT Code" },
                "isAccessibleForFree": true,
                "keywords": ["DMT", "N,N-DMT", "visual symbols", "psychedelic phenomenology", "650 nm", "entoptic"],
                "distribution": [
                  { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://dmtcode.com/data.json" }
                ]
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dmtcode.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Registry", "item": "https://dmtcode.com/registry" }
                ]
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main id="main-content" className="relative z-10 pt-20" role="main">
          <Breadcrumb />
          <RegistryHero />
          <RegistryRationale />
          <RegistryStatistics />
          <p className="container mx-auto px-4 max-w-4xl text-sm text-muted-foreground">
            The registry shows every published record. The export at /data.json includes only records whose contributor granted publication consent, so its count is lower than the registry count.
          </p>
          
          {/* Voice Logger Callout */}
          <section className="container mx-auto px-4 py-8 max-w-4xl">
            <div 
              className="p-4 md:p-6 rounded-lg border border-border bg-card"
              role="complementary"
              aria-label="Voice Logger recommendation"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0 p-3 rounded-full bg-muted">
                  <Mic className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Record Your Experience First
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use the Voice Logger to capture your thoughts right after your session, while the memory
                    is fresh. You need an account, because the recording stays yours. The audio is sent for
                    automatic transcription, and the transcript is then scanned for a fixed list of keywords
                    and grouped under theme names. That grouping is a word match on the text. It is not an
                    interpretation of what you experienced.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/log')} 
                  className="whitespace-nowrap flex-shrink-0 gap-2"
                  size="lg"
                >
                  <Mic className="h-4 w-4" />
                  Start Voice Recording
                </Button>
              </div>
            </div>
          </section>

          <p className="container mx-auto px-4 max-w-4xl text-sm text-muted-foreground">
            Recording here is marked as catalogue exposed, because this page shows other people's symbols. To record a memory blind, start at the <a href="/capture" className="underline hover:text-foreground">capture page</a> instead.
          </p>
          <LayeredSubmissionForm captureRoute="registry_page" />
          <RegistryBrowser />
          <RegistryDownloads />
          <DrawnGlyphReports />
          <RegistryResources />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Registry;
