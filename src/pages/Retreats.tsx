import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { SEO } from '@/components/SEO';
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import RetreatCard from "@/components/events/RetreatCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Retreat {
  id: string;
  name: string;
  description: string | null;
  location: string;
  country: string | null;
  image_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  tags: string[] | null;
}

const OG_IMAGE =
  "https://dmtcode.com/og-image.png";

const TITLE = "Retreat centers | DMT Code";
const DESC =
  "Psychedelic retreat centers that operate openly and publish who they are and where. A listing is not an endorsement. Verify legal status and medical screening directly with each center.";

const PARA_1 =
  "Centers that operate openly and publish who they are, where they operate, and under what legal framework. This list is short on purpose. Centers we could not confirm are currently operating are not shown.";
const PARA_2 =
  "A listing here is not an endorsement. Psychedelic retreats carry real medical and psychological risk, and the legal position varies by country and changes. Verify current legal status, medical screening practice, staff credentials and emergency procedures directly with the center before you book.";

const Retreats = () => {
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("retreats")
        .select("id,name,description,location,country,image_url,website_url,contact_email,tags")
        .eq("is_approved", true)
        .order("name", { ascending: true });
      if (!error) setRetreats((data as Retreat[]) || []);
      setLoading(false);
    })();
  }, []);

  const jsonLd = useMemo(() => {
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com" },
        { "@type": "ListItem", position: 2, name: "Retreat centers", item: "https://dmtcode.com/retreats" },
      ],
    };
    if (retreats.length === 0) return [breadcrumb];
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: retreats.length,
      itemListElement: retreats.map((r, i) => {
        const detailUrl = `https://dmtcode.com/retreats/${r.id}`;
        const item: Record<string, unknown> = {
          "@type": "LodgingBusiness",
          "@id": detailUrl,
          name: r.name,
          url: r.website_url || detailUrl,
          address: {
            "@type": "PostalAddress",
            ...(r.location ? { addressLocality: r.location } : {}),
            ...(r.country ? { addressCountry: r.country } : {}),
          },
        };
        if (r.description) item.description = r.description;
        if (r.image_url) item.image = r.image_url;
        if (r.contact_email) item.email = r.contact_email;
        return { "@type": "ListItem", position: i + 1, item };
      }),
    };
    return [breadcrumb, itemList];
  }, [retreats]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO uiKey="retreats" path="/retreats" />
      <Helmet>
        <meta property="og:type" content="website" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
        {jsonLd.map((ld, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
        ))}
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-7xl py-10" role="main">
        <Breadcrumb />

        <header className="mb-8 space-y-4 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Retreat centers</h1>
          <p className="text-muted-foreground leading-relaxed">We know of no legal retreat or public event that runs this laser observation protocol with inhaled N,N-DMT. The listings below are for context only and do not run it. If that changes, it will be stated here first.</p>
          <p className="text-muted-foreground leading-relaxed">{PARA_1}</p>
          <p className="text-muted-foreground leading-relaxed">{PARA_2}</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : retreats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {retreats.map((r) => (
              <RetreatCard
                key={r.id}
                retreat={{
                  id: r.id,
                  name: r.name,
                  description: r.description,
                  location: r.location,
                  country: r.country,
                  image_url: r.image_url,
                  website_url: r.website_url,
                  contact_email: r.contact_email,
                  tags: r.tags ?? [],
                }}
              />
            ))}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default Retreats;
