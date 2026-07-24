import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowLeft, MapPin, Mail } from "lucide-react";

interface RetreatRow {
  id: string;
  name: string;
  description: string | null;
  details: string | null;
  location: string;
  country: string | null;
  image_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  tags: string[] | null;
  is_approved: boolean;
}

const RetreatDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [retreat, setRetreat] = useState<RetreatRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("retreats")
        .select("*")
        .eq("id", id)
        .eq("is_approved", true)
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setRetreat(data as RetreatRow);
      setLoading(false);
    })();
  }, [id]);

  if (notFound) return <Navigate to="/events" replace />;

  const paragraphs = (retreat?.details || retreat?.description || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const canonical = `https://dmtcode.com/retreats/${id}`;
  const locationLine = retreat
    ? [retreat.location, retreat.country].filter(Boolean).join(", ")
    : "";

  const orgJsonLd = retreat
    ? {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        name: retreat.name,
        description: retreat.description || undefined,
        ...(retreat.image_url ? { image: retreat.image_url } : {}),
        ...(retreat.website_url ? { url: retreat.website_url } : {}),
        ...(retreat.contact_email ? { email: retreat.contact_email } : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: retreat.location,
          ...(retreat.country ? { addressCountry: retreat.country } : {}),
        },
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com/" },
      { "@type": "ListItem", position: 2, name: "Events", item: "https://dmtcode.com/events" },
      ...(retreat
        ? [{ "@type": "ListItem", position: 3, name: retreat.name, item: canonical }]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{retreat ? `${retreat.name} | DMT Code Retreats` : "Retreat | DMT Code"}</title>
        <meta name="description" content={retreat?.description?.slice(0, 155) || "Retreat listing on DMT Code."} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={retreat ? `${retreat.name} | DMT Code Retreats` : "Retreat | DMT Code"} />
        <meta property="og:description" content={retreat?.description?.slice(0, 155) || ""} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        {retreat?.image_url && <meta property="og:image" content={retreat.image_url} />}
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        {orgJsonLd && <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>}
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-4xl py-10" role="main">
        <Breadcrumb />
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>

        {loading || !retreat ? (
          <Skeleton className="w-full h-64" />
        ) : (
          <article className="space-y-6">
            <header className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{retreat.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                {locationLine && (
                  <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {locationLine}</span>
                )}
              </div>
              {retreat.tags && retreat.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {retreat.tags.map((t, i) => (
                    <Badge key={i} variant="secondary">{t}</Badge>
                  ))}
                </div>
              )}
            </header>

            {retreat.image_url && (
              <img
                src={retreat.image_url}
                alt={`${retreat.name} retreat center`}
                className="w-full max-h-96 object-cover rounded-2xl border border-border/50"
              />
            )}

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-muted-foreground">No further details provided.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {retreat.website_url && (
                <Button asChild size="lg" className="rounded-full">
                  <a href={retreat.website_url} target="_blank" rel="noopener noreferrer">
                    Visit website <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
              {retreat.contact_email && (
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <a href={`mailto:${retreat.contact_email}`}>
                    <Mail className="w-4 h-4 mr-2" /> {retreat.contact_email}
                  </a>
                </Button>
              )}
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RetreatDetail;
