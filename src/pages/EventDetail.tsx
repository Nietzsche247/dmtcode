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
import { ExternalLink, ArrowLeft, MapPin, Calendar } from "lucide-react";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  details: string | null;
  event_date: string;
  event_type: string;
  location: string | null;
  organizer: string | null;
  url: string | null;
  is_approved: boolean;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("is_approved", true)
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setEvent(data as EventRow);
      setLoading(false);
    })();
  }, [id]);

  if (notFound) return <Navigate to="/events" replace />;

  const paragraphs = (event?.details || event?.description || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const canonical = `https://dmtcode.com/events/${id}`;
  const readableDate = event
    ? new Date(event.event_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const eventJsonLd = event
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        startDate: event.event_date,
        description: event.description || undefined,
        ...(event.location
          ? { location: { "@type": "Place", name: event.location } }
          : {}),
        ...(event.organizer
          ? {
              organizer: {
                "@type": "Organization",
                name: event.organizer,
                ...(event.url ? { url: event.url } : {}),
              },
            }
          : {}),
        ...(event.url ? { url: event.url } : {}),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dmtcode.com/" },
      { "@type": "ListItem", position: 2, name: "Events", item: "https://dmtcode.com/events" },
      ...(event
        ? [{ "@type": "ListItem", position: 3, name: event.title, item: canonical }]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{event ? `${event.title} | DMT Code Events` : "Event | DMT Code Events"}</title>
        <meta name="description" content={event?.description?.slice(0, 155) || "Research event listing on DMT Code."} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={event ? `${event.title} | DMT Code Events` : "Event | DMT Code Events"} />
        <meta property="og:description" content={event?.description?.slice(0, 155) || ""} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        {eventJsonLd && <script type="application/ld+json">{JSON.stringify(eventJsonLd)}</script>}
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-4xl py-10" role="main">
        <Breadcrumb />
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>

        {loading || !event ? (
          <Skeleton className="w-full h-64" />
        ) : (
          <article className="space-y-6">
            <header className="space-y-4">
              <Badge variant="secondary">{event.event_type}</Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" /> {readableDate}</span>
                {event.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                )}
                {event.organizer && <span>Organizer: {event.organizer}</span>}
              </div>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-muted-foreground">No further details provided.</p>
              )}
            </div>

            {event.url && (
              <div>
                <Button asChild size="lg" className="rounded-full">
                  <a href={event.url} target="_blank" rel="noopener noreferrer">
                    Official site <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
