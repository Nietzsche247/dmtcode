import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Breadcrumb } from "@/components/Breadcrumb";
import EventsTimeline from "@/components/events/EventsTimeline";
import TrialsTimeline from "@/components/events/TrialsTimeline";
import RetreatColumnList from "@/components/events/RetreatColumnList";
import FestivalsList from "@/components/events/FestivalsList";
import UpcomingEventsList from "@/components/events/UpcomingEventsList";
import ActiveTrialsList from "@/components/events/ActiveTrialsList";
import EventSubmissionModal from "@/components/events/EventSubmissionModal";
import TrialSubmissionModal from "@/components/events/TrialSubmissionModal";
import RetreatSubmissionModal from "@/components/events/RetreatSubmissionModal";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  description: string | null;
  event_type: string | null;
}

const titleCase = (s: string) => s.length ? s[0].toUpperCase() + s.slice(1) : s;

const Events = () => {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [retreatModalOpen, setRetreatModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, location, description, event_type")
        .eq("is_approved", true);
      const rows = (data || []) as EventRow[];
      setAllEvents(rows);
      const distinct = Array.from(
        new Set(rows.map(r => r.event_type).filter((v): v is string => !!v && v !== "festival"))
      ).sort();
      setAvailableTypes(distinct);
    })();
  }, []);

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const showTypeFilter = availableTypes.length >= 2;

  const jsonLd = useMemo(() => {
    const items = allEvents
      .filter(e => e.event_date && e.title)
      .slice()
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .map((e, idx) => {
        const ev: Record<string, unknown> = {
          "@type": "Event",
          name: e.title,
          startDate: e.event_date,
          url: `https://dmtcode.com/events/${e.id}`,
        };
        if (e.location) {
          ev.location = { "@type": "Place", name: e.location };
        }
        if (e.description) {
          ev.description = e.description;
        }
        return {
          "@type": "ListItem",
          position: idx + 1,
          item: ev,
        };
      });
    if (items.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items,
    };
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Research Events & Clinical Trials | DMT Code</title>
        <meta
          name="description"
          content="Timeline of psychedelic research events, clinical trials and retreat centers. A community sourced scholarly reference for DMT research milestones."
        />
        <link rel="canonical" href="https://dmtcode.com/events" />
        <meta property="og:title" content="Research Events & Clinical Trials | DMT Code" />
        <meta property="og:description" content="Timeline of psychedelic research events, clinical trials and retreat centers. A community sourced scholarly reference for DMT research milestones." />
        <meta property="og:url" content="https://dmtcode.com/events" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/events" />
        <meta name="twitter:title" content="Research Events & Clinical Trials | DMT Code" />
        <meta name="twitter:description" content="Timeline of psychedelic research events, clinical trials and retreat centers. A community sourced scholarly reference for DMT research milestones." />
        <meta name="twitter:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/xpje0qbzg7e7wLYOGt4x2WGDXtR2/social-images/social-1763590629562-Webp.net-resizeimage-3.png" />
        <meta name="robots" content="index, follow" />
        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>

      <Navigation />

      <main id="main-content" className="container mx-auto px-4 max-w-7xl" role="main">
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" style={{ top: '20%' }} />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase animate-blur-in-up" style={{ animationFillMode: 'forwards' }}>
              Research Timeline
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9] animate-blur-in-up animation-delay-100" style={{ animationFillMode: 'forwards' }}>
              Events & Trials
              <span className="block text-primary mt-2">Live Dashboard</span>
            </h1>

            <p className="text-lg md:text-xl font-light text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-blur-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
              Community sourced and moderator reviewed. Inclusion is not an endorsement.
            </p>
          </div>
        </section>

        <Breadcrumb />

        <Alert className="mb-8 sticky top-20 z-40 border-border/50 bg-card/80 backdrop-blur rounded-2xl">
          <AlertDescription className="text-sm font-light">
            <strong className="font-semibold">Scholarly Reference Only:</strong> This timeline aggregates community-reported events and publicly available clinical trial data.
            Inclusion does not constitute endorsement.
          </AlertDescription>
        </Alert>

        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setEventModalOpen(true)} className="rounded-full btn-lickable">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>

          {showTypeFilter && (
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters {typeFilters.length > 0 && `(${typeFilters.length})`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 border border-border rounded-lg p-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Event Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={typeFilters.includes(type)}
                          onCheckedChange={() => toggleTypeFilter(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                          {titleCase(type)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {typeFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setTypeFilters([])}>
                    Clear All Filters
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mb-1">Upcoming events</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Soonest first. Past events are kept at the bottom of this page for the record.
              </p>
              <EventsTimeline filter="upcoming" types={typeFilters} excludeTypes={["festival"]} emptyLabel="No upcoming events yet." />
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold">Clinical trials</h3>
                <Button
                  onClick={() => setTrialModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-full btn-lickable"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Clinical Trial
                </Button>
              </div>
              <TrialsTimeline />
            </section>
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-2xl font-semibold">Retreat centers</h2>
                <Button
                  onClick={() => setRetreatModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-full btn-lickable"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Retreat
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Centers that operate openly and publish who they are and where. A listing here is not an endorsement. Verify legal status, medical screening and staff credentials directly with the center before booking.
              </p>
              <RetreatColumnList />
              <p className="mt-4 text-sm">
                <Link to="/retreats" className="underline underline-offset-4 hover:text-primary">All retreat centers</Link>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-1">Festivals</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Psychedelic-culture festivals worldwide. A listing is not an endorsement.
              </p>
              <FestivalsList />
            </section>



            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Next 10 Events</h3>
              <UpcomingEventsList />
            </div>
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Active &amp; Recruiting Trials</h3>
              <ActiveTrialsList />
            </div>
          </aside>
        </div>

        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-1 text-muted-foreground">Past events</h2>
          <p className="text-xs text-muted-foreground mb-3">Past events, kept for the record.</p>
          <EventsTimeline filter="past" types={typeFilters} excludeTypes={["festival"]} muted emptyLabel="No past events on record." />
        </section>


        <Alert className="mt-12 border-muted">
          <AlertDescription className="text-xs text-muted-foreground">
            <strong>Medical & Legal Disclaimer:</strong> This page is for educational and research reference purposes only.
            It does not constitute medical advice, treatment recommendation, or legal counsel. Psychedelic substances remain
            controlled in most jurisdictions. Consult licensed professionals before participation in any therapeutic or ceremonial context.
            A listing here is not an endorsement. Verify legal status, medical screening, staff credentials and emergency procedures directly with the organizer or center before you book. The DMT Code Project assumes no liability
            for outcomes related to information presented here.
          </AlertDescription>
        </Alert>
      </main>

      <Footer />

      <EventSubmissionModal open={eventModalOpen} onOpenChange={setEventModalOpen} />
      <TrialSubmissionModal open={trialModalOpen} onOpenChange={setTrialModalOpen} />
      <RetreatSubmissionModal open={retreatModalOpen} onOpenChange={setRetreatModalOpen} />
    </div>
  );
};

export default Events;
