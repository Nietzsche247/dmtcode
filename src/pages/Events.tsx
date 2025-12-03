import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Breadcrumb } from "@/components/Breadcrumb";
import EventsTimeline from "@/components/events/EventsTimeline";
import TrialsTimeline from "@/components/events/TrialsTimeline";
import RetreatGrid from "@/components/events/RetreatGrid";
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

const Events = () => {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [retreatModalOpen, setRetreatModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Multi-select filters
  const [compoundFilters, setCompoundFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  const compounds = ['DMT', 'Psilocybin', 'LSD', 'MDMA', 'Ayahuasca', 'Ibogaine', '5-MeO-DMT'];
  const types = ['Conference', 'Workshop', 'Retreat', 'Clinical Trial'];

  const toggleCompoundFilter = (compound: string) => {
    setCompoundFilters(prev =>
      prev.includes(compound) ? prev.filter(c => c !== compound) : [...prev, compound]
    );
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Research Events & Clinical Trials | DMT Code</title>
        <meta 
          name="description" 
          content="Timeline of psychedelic research events, clinical trials, and verified retreats. Community-sourced scholarly reference for DMT research milestones." 
        />
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section - Meng To Style */}
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
              Scholarly reference of psychedelic research milestones, community gatherings, and ongoing clinical studies.
            </p>
          </div>
        </section>

        <Breadcrumb />

        {/* Sticky Scholarly Disclaimer Banner */}
        <Alert className="mb-8 sticky top-20 z-40 border-border/50 bg-card/80 backdrop-blur rounded-2xl">
          <AlertDescription className="text-sm font-light">
            <strong className="font-semibold">Scholarly Reference Only:</strong> This timeline aggregates community-reported events and publicly available clinical trial data. 
            Inclusion does not constitute endorsement.
          </AlertDescription>
        </Alert>

        {/* Submission Buttons + Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setEventModalOpen(true)}
              className="rounded-full btn-lickable"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
            <Button
              onClick={() => setTrialModalOpen(true)}
              variant="outline"
              className="rounded-full btn-lickable"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Clinical Trial
            </Button>
            <Button
              onClick={() => setRetreatModalOpen(true)}
              variant="outline"
              className="rounded-full btn-lickable"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Retreat
            </Button>
          </div>

          {/* Multi-select Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters {(compoundFilters.length + typeFilters.length > 0) && `(${compoundFilters.length + typeFilters.length})`}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 border border-border rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Compounds</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {compounds.map((compound) => (
                    <div key={compound} className="flex items-center space-x-2">
                      <Checkbox
                        id={`compound-${compound}`}
                        checked={compoundFilters.includes(compound)}
                        onCheckedChange={() => toggleCompoundFilter(compound)}
                      />
                      <Label
                        htmlFor={`compound-${compound}`}
                        className="text-sm cursor-pointer"
                      >
                        {compound}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Event Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {types.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={typeFilters.includes(type)}
                        onCheckedChange={() => toggleTypeFilter(type)}
                      />
                      <Label
                        htmlFor={`type-${type}`}
                        className="text-sm cursor-pointer"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {(compoundFilters.length > 0 || typeFilters.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCompoundFilters([]);
                    setTypeFilters([]);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Dual Timeline Section with Summary Columns */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Events Timeline</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Top: Public & private events (dark red) • Bottom: Clinical trials (color-coded by status)
          </p>
          <div className="flex gap-8">
            <div className="flex-1 space-y-6">
              <EventsTimeline />
              <TrialsTimeline />
            </div>
            {/* Summary Columns - Desktop only */}
            <div className="hidden lg:flex flex-col gap-6 w-80 flex-shrink-0">
              <div className="border border-border rounded-lg p-4 bg-card sticky top-24">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Next 10 Events</h3>
                <UpcomingEventsList />
              </div>
              <div className="border border-border rounded-lg p-4 bg-card sticky top-96">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Active & Recruiting Trials</h3>
                <ActiveTrialsList />
              </div>
            </div>
          </div>
        </section>

        {/* Retreat Grid Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Verified Retreats & Centers</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Community-rated retreat centers with transparent trust metrics. Ratings are independently verified and moderated.
          </p>
          <RetreatGrid />
        </section>

        {/* Footer Disclaimer */}
        <Alert className="mt-12 border-muted">
          <AlertDescription className="text-xs text-muted-foreground">
            <strong>Medical & Legal Disclaimer:</strong> This page is for educational and research reference purposes only. 
            It does not constitute medical advice, treatment recommendation, or legal counsel. Psychedelic substances remain 
            controlled in most jurisdictions. Consult licensed professionals before participation in any therapeutic or ceremonial context. 
            Trust ratings reflect community perception only and do not guarantee safety or quality. The DMT Code Project assumes no liability 
            for outcomes related to information presented here. Always verify retreat credentials, legal status, and medical contraindications independently.
          </AlertDescription>
        </Alert>
      </main>

      <Footer />

      {/* Submission Modals */}
      <EventSubmissionModal open={eventModalOpen} onOpenChange={setEventModalOpen} />
      <TrialSubmissionModal open={trialModalOpen} onOpenChange={setTrialModalOpen} />
      <RetreatSubmissionModal open={retreatModalOpen} onOpenChange={setRetreatModalOpen} />
    </div>
  );
};

export default Events;
