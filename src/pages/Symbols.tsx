import { usePrerenderedLd } from '@/lib/prerenderedLd';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SEO } from '@/components/SEO';
import { LocalizedBody } from '@/components/LocalizedBody';
import { GolerAttribution } from '@/components/GolerAttribution';
import { FieldGuideCard } from '@/components/FieldGuideCard';
import { FIELD_GUIDE_LIVE } from '@/data/fieldGuide';
import { KIT_MIN_PRICE } from '@/data/kits';
import { useLocalizedBody } from '@/hooks/useLocalizedBody';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { uiCopy } from '@/i18n/ui-strings';
import { supabase } from '@/integrations/supabase/client';
import { markCatalogueSeen } from '@/lib/catalogueExposure';
import { sortSymbolRecords, symbolRecordTitle, recordLabel, SOURCE_METHOD_LABELS, EVIDENCE_STATUS_LABELS, PRIOR_EXPOSURE_LABELS } from '@/lib/symbolRecords';

// Editorial copy and hrefs mirror STATIC_PAGES.symbols in netlify/edge-functions/content-prerender.ts.
const INTRO_MARKUP = "<h1>DMT laser code symbols</h1><p>The DMT laser code symbols are the visual forms that observers have reported and drawn after looking at a 650 nm laser diffracted through a grating, during an N,N-DMT experience or sober, kept here as a registry of dated, attributed, observer-submitted records. We do not know whether the phenomenon is real; the registry exists so that the raw reports can be read, cited and disputed by anyone.</p><p>It is a record of what observers drew. It is not a key, not a translation, and not a claim that the forms mean anything. Reading it counts as having seen the catalogue, so if you have seen something and have not recorded it yet, record it first and then come back.</p>";
const REQUIRE_HREFS = Array.from(INTRO_MARKUP.matchAll(/href="([^"]+)"/g)).map((m) => m[1]);

// Mirrors REGISTRY_REPORT_LD in the prerender and the Report in src/pages/Registry.tsx.
const REGISTRY_DOCUMENT = {
  '@type': 'DigitalDocument', '@id': 'https://dmtcode.com/downloads/dmt-laser-code-symbols.pdf',
  name: 'The DMT Code Symbol Registry: Reported Visual Forms in Altered and Baseline States',
  alternateName: 'Volume 1. N,N-DMT and the 650 nm laser protocol',
  identifier: 'https://doi.org/10.5281/zenodo.22101522',
  author: { '@type': 'Person', name: 'Aaron Baker' },
  publisher: { '@type': 'Organization', name: 'DMT Code', url: 'https://dmtcode.com' },
  datePublished: '2026-08-25', version: '1.0', license: 'https://creativecommons.org/licenses/by/4.0/',
  url: 'https://dmtcode.com/downloads/dmt-laser-code-symbols.pdf', encodingFormat: 'application/pdf',
  isBasedOn: 'https://doi.org/10.5281/zenodo.17816519', isAccessibleForFree: true, inLanguage: 'en',
};

export default function Symbols() {
  const prerenderedLd0 = usePrerenderedLd({ id: 'https://dmtcode.com/symbols' });
  const locale = useLocale();
  const html = useLocalizedBody('symbols', { requireHrefs: REQUIRE_HREFS });
  const to = (path: string) => localePath(locale, path);
  const { data, isError } = useQuery({
    queryKey: ['symbols-landing-records'],
    queryFn: async () => {
      const [records, total] = await Promise.all([
        supabase.from('symbol_submissions').select('id, description, image_url, source_method, evidence_status, prior_exposure, is_curated_example, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(120),
        supabase.from('symbol_submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);
      if (records.error) throw records.error;
      return { rows: sortSymbolRecords(records.data), total: total.error ? null : total.count };
    },
  });
  const rows = data?.rows ?? [];
  const collection = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': 'https://dmtcode.com/symbols',
    url: 'https://dmtcode.com/symbols', name: 'DMT laser code symbols', description: uiCopy('symbols', 'en').description,
    license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true,
    publisher: { '@id': 'https://dmtcode.com#org' }, hasPart: [REGISTRY_DOCUMENT],
    ...(data ? { mainEntity: { '@type': 'ItemList', name: 'Registry symbol records', numberOfItems: rows.length,
      itemListOrder: 'https://schema.org/ItemListUnordered', itemListElement: rows.map((row, i) => ({
        '@type': 'ListItem', position: i + 1, url: `https://dmtcode.com/registry/${row.id}`,
        item: { '@type': 'CreativeWork', '@id': `https://dmtcode.com/registry/${row.id}`, name: symbolRecordTitle(row), image: row.image_url },
      })) } } : {}),
  };
  return <div className="relative min-h-screen bg-background">
    <SEO uiKey="symbols" path="/symbols" canonicalToEnglish={locale !== 'en' && !html} />
    <Helmet>{!(prerenderedLd0) && (<script type="application/ld+json">{JSON.stringify(collection)}</script>)}</Helmet>
    <Navigation /><Breadcrumb />
    <main id="main-content" className="relative z-10 pt-4" role="main">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl space-y-10">
        <LocalizedBody pageId="symbols" html={html}>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">DMT laser code symbols</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">The DMT laser code symbols are the visual forms that observers have reported and drawn after looking at a 650 nm laser diffracted through a grating, during an N,N-DMT experience or sober, kept here as a registry of dated, attributed, observer-submitted records. We do not know whether the phenomenon is real; the registry exists so that the raw reports can be read, cited and disputed by anyone.</p>
          <p className="text-muted-foreground leading-relaxed">It is a record of what observers drew. It is not a key, not a translation, and not a claim that the forms mean anything. Reading it counts as having seen the catalogue, so if you have seen something and have not recorded it yet, record it first and then come back.</p>
        </LocalizedBody>
        <section data-prerender="symbols-pdf" className="space-y-4">
          <h2 className="font-display text-3xl">The symbols as a free, citable PDF</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-display text-2xl">The DMT Code Symbol Registry: Reported Visual Forms in Altered and Baseline States</h3>
            <p>Volume 1. N,N-DMT and the 650 nm laser protocol</p>
            <p className="text-muted-foreground">Version 1.0, 25 August 2026. DOI <a className="text-primary underline" href="https://doi.org/10.5281/zenodo.22101522">10.5281/zenodo.22101522</a>. 18 pages, A4. 51 records: 21 seed illustrations drawn for the registry and 30 contributor submissions from 11 contributors. Licence CC BY 4.0. Author: Aaron Baker.</p>
            <a className="text-primary underline" href="/downloads/dmt-laser-code-symbols.pdf" download onClick={markCatalogueSeen}>Download the PDF</a>
            <p className="text-muted-foreground">Cite it, print it, argue with it. Nothing in it has been verified, replicated under controlled conditions, or established as a phenomenon.</p>
            <Link className="text-primary underline" to={to('/capture')}>Record what you saw first</Link>
          </div>
        </section>
        <section className="space-y-5">
          <h2 className="font-display text-3xl">The records, as submitted</h2>
          <p className="text-muted-foreground">Pulled from the registry when this page was generated. Records that declare the 650 nm laser method are listed first; the rest are accounts of a DMT experience that do not state a method, and they are not evidence about the laser specifically.</p>
          {data && data.total !== null && <p className="text-sm text-muted-foreground">{rows.length} records shown of {data.total} published.</p>}
          {isError && <Link className="text-primary underline" to={to('/registry')}>Visual symbol registry</Link>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rows.map((row) => <Link key={row.id} to={to(`/registry/${row.id}`)} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-square bg-primary-foreground p-4"><img className="w-full h-full object-contain" src={row.image_url || '/placeholder-symbol-1.svg'} alt={`Symbol ${row.id.slice(0, 8)}: ${symbolRecordTitle(row)}`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/placeholder-symbol-1.svg'; }} /></div>
              <div className="p-4 space-y-3"><h3 className="font-semibold break-words">{symbolRecordTitle(row)}</h3>
                <dl className="text-xs space-y-2 text-muted-foreground">
                  <div><dt>Source method</dt><dd className="text-foreground">{recordLabel(SOURCE_METHOD_LABELS, row.source_method)}</dd></div>
                  <div><dt>Evidence status</dt><dd className="text-foreground">{recordLabel(EVIDENCE_STATUS_LABELS, row.evidence_status)}</dd></div>
                  <div><dt>Prior exposure</dt><dd className="text-foreground">{recordLabel(PRIOR_EXPOSURE_LABELS, row.prior_exposure)}</dd></div>
                </dl>
                {row.is_curated_example && <span className="block border border-border rounded-sm p-2 text-xs text-muted-foreground">Seed illustration, drawn for the registry</span>}
              </div>
            </Link>)}
          </div>
          <p className="text-muted-foreground">Every record, with filters and submission, is at <Link className="text-primary underline" to={to('/registry')}>/registry</Link>. Reports of seeing nothing are counted too: <Link className="text-primary underline" to={to('/null-reports')}>/null-reports</Link>.</p>
        </section>
        <section data-prerender="symbols-how" className="space-y-5">
          <h2 className="font-display text-3xl">How a record is made</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[
            ['Observe', 'Notice a discrete visual form during an N,N-DMT experience.'],
            ['Draw or Respond', 'Reconstruct it on the canvas, or tell us whether one already recorded resembles what you saw.'],
            ['It joins the open record', 'Openly licensed CC-BY-4.0 and downloadable as data.'],
          ].map(([heading, text]) => <div key={heading}><h3 className="font-display text-2xl">{heading}</h3><p className="text-muted-foreground mt-3">{text}</p></div>)}</div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-primary">
            <Link to={to('/capture')} className="hover:underline">Record what you saw</Link>
            <Link to={to('/protocol-guide')} className="hover:underline">The observation protocol</Link>
            <Link to={to('/co-witnesses')} className="hover:underline">Compare your memory against other recollections</Link>
          </div>
        </section>
        {FIELD_GUIDE_LIVE && <section className="space-y-5"><h2 className="font-display text-3xl">A printed guide to running and recording a session</h2><p className="text-muted-foreground">The free documents cover the procedure. The Field Guide is the same procedure as a 23 page printable, sold by Meridian Optics Lab.</p><div className="max-w-xl"><FieldGuideCard /></div></section>}
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-primary">{[
          ['/registry', 'Visual symbol registry'], ['/documents', 'All free documents'], ['/capture', 'Record what you saw'],
          ['/protocol-guide', 'The observation protocol'], ['/prepare', `Kits from $${KIT_MIN_PRICE}`], ['/co-witnesses', 'Compare recollections'],
        ].map(([path, label]) => <Link key={path} to={to(path)} className="hover:underline">{label}</Link>)}</div>
        <GolerAttribution />
      </div>
    </main><Footer />
  </div>;
}
