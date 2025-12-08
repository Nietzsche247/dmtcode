import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { IntroductionAccordion } from "@/components/forecasts/IntroductionAccordion";
import { ConfidenceTierFilters, type ConfidenceTier } from "@/components/forecasts/ConfidenceTierFilters";
import { CriticalPathTimeline } from "@/components/forecasts/CriticalPathTimeline";
import { EventCardsGrid } from "@/components/forecasts/EventCardsGrid";
import { DependencyGraphD3 } from "@/components/forecasts/DependencyGraphD3";
import { EventDetailPanel } from "@/components/forecasts/EventDetailPanel";
import { ScenarioToggles, type AlignmentBranch } from "@/components/forecasts/ScenarioToggles";
import { ExportButtons } from "@/components/forecasts/ExportButtons";
import { MethodologyAccordion } from "@/components/forecasts/MethodologyAccordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useCascadeEngine } from "@/hooks/useCascadeEngine";
import { 
  getForecasts, 
  getMethodology, 
  getDependencyRules,
  processForecasts,
  type ForecastEvent,
  type Methodology,
  type DependencyRule
} from "@/lib/forecasts-api";
import { format } from "date-fns";

export default function Forecasts() {
  const [events, setEvents] = useState<ForecastEvent[]>([]);
  const [dependencyRules, setDependencyRules] = useState<DependencyRule[]>([]);
  const [methodology, setMethodology] = useState<Methodology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Panel state
  const [selectedEvent, setSelectedEvent] = useState<ForecastEvent | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  
  // Scenario state
  const [taiwanConflict, setTaiwanConflict] = useState(true);
  const [alignment, setAlignment] = useState<AlignmentBranch>('cooperative');
  const [showSecondaryEvents, setShowSecondaryEvents] = useState(true);
  
  // Confidence tier filter
  const [confidenceTier, setConfidenceTier] = useState<ConfidenceTier>('high');

  // Cascade engine
  const {
    adjustedEvents,
    affectedEvents,
    cascadeState,
    handleEventDrag,
    reset,
    affectedCount
  } = useCascadeEngine(events, dependencyRules);

  const handleEventClick = (event: ForecastEvent) => {
    setSelectedEvent(event);
    setPanelOpen(true);
  };

  const handleReset = () => {
    reset();
    setTaiwanConflict(true);
    setAlignment('cooperative');
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [forecastsData, methodologyData, rulesData] = await Promise.all([
          getForecasts(),
          getMethodology(),
          getDependencyRules()
        ]);
        
        if (forecastsData.length > 0) {
          const processedEvents = processForecasts(forecastsData);
          setEvents(processedEvents);
          
          const latestUpdate = forecastsData.reduce((latest, f) => {
            const fDate = new Date(f.updated_at);
            return fDate > new Date(latest) ? f.updated_at : latest;
          }, forecastsData[0].updated_at);
          setLastUpdated(latestUpdate);
        }
        
        setMethodology(methodologyData);
        setDependencyRules(rulesData);
      } catch (err) {
        console.error('Error loading forecasts:', err);
        setError('Failed to load forecast data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Major Event Forecasting Model 2026-2033 | DMT Code Project</title>
        <meta 
          name="description" 
          content="Interactive probabilistic model of transformative events from 2026-2033. Drag events to simulate cascade effects." 
        />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-background pt-20">
        {/* Introduction with Pull Quote Accordion */}
        <IntroductionAccordion />

        {/* Page Header */}
        <section className="container mx-auto px-4 py-10 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-3">
              Major Event Forecasting Model for
              <span className="text-primary"> 2026-2033</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mb-3">
              Interactive Probability Model with Cascade Dependencies
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {format(new Date(lastUpdated), 'MMMM d, yyyy')}
              </p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-2">
              {events.length} events in model. Drag spine events to simulate cascades.
            </p>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <section className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
                <p className="text-destructive">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 text-primary hover:underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <section className="container mx-auto px-4 py-8">
            <Skeleton className="h-96 w-full rounded-xl" />
          </section>
        )}

        {/* Main Content */}
        {!loading && !error && events.length > 0 && (
          <>
            {/* Confidence Tier Filters */}
            <section className="container mx-auto px-4 py-6">
              <div className="max-w-6xl mx-auto">
                <ConfidenceTierFilters
                  activeTier={confidenceTier}
                  onTierChange={setConfidenceTier}
                />
              </div>
            </section>

            {/* Critical Path Timeline */}
            <section className="container mx-auto px-4 py-6">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-foreground mb-1">Critical Path</h2>
                  <p className="text-muted-foreground font-light text-sm">
                    The causal chain from AI capability to superintelligence
                  </p>
                </div>
                <div className="bg-card/30 border border-border/50 rounded-xl p-4 md:p-6 overflow-x-auto">
                  <CriticalPathTimeline
                    events={events}
                    dependencyRules={dependencyRules}
                    confidenceTier={confidenceTier}
                    onEventClick={handleEventClick}
                    onEventDrag={handleEventDrag}
                    adjustedEvents={adjustedEvents}
                    affectedEvents={affectedEvents}
                    cascadeState={cascadeState}
                  />
                </div>
              </div>
            </section>

            {/* Scenario Controls - Moved below timeline */}
            <section className="container mx-auto px-4 py-6">
              <div className="max-w-6xl mx-auto">
                <ScenarioToggles
                  taiwanConflict={taiwanConflict}
                  onTaiwanConflictChange={setTaiwanConflict}
                  alignment={alignment}
                  onAlignmentChange={setAlignment}
                  showSecondaryEvents={showSecondaryEvents}
                  onShowSecondaryEventsChange={setShowSecondaryEvents}
                  onReset={handleReset}
                  affectedCount={affectedCount}
                />
              </div>
            </section>

            {/* Dependency Network */}
            <section className="container mx-auto px-4 py-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-foreground mb-1">Dependency Network</h2>
                  <p className="text-muted-foreground font-light text-sm">
                    How events cascade through the system
                  </p>
                </div>
                <div className="bg-card/30 border border-border/50 rounded-xl p-4">
                  <DependencyGraphD3
                    events={events}
                    dependencyRules={dependencyRules}
                    onEventClick={handleEventClick}
                  />
                </div>
              </div>
            </section>

            {/* Event Cards Grid */}
            <section className="container mx-auto px-4 py-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-foreground mb-1">Event Details</h2>
                  <p className="text-muted-foreground font-light text-sm">
                    Click any card to view full cascade effects
                  </p>
                </div>
                <EventCardsGrid
                  events={events}
                  showSecondaryEvents={showSecondaryEvents}
                  onEventClick={handleEventClick}
                  adjustedEvents={adjustedEvents}
                  affectedEvents={affectedEvents}
                  cascadeState={cascadeState}
                />
              </div>
            </section>

            {/* Export */}
            <section className="container mx-auto px-4 py-6">
              <div className="max-w-6xl mx-auto">
                <ExportButtons events={events} methodology={methodology} dependencyRules={dependencyRules} />
              </div>
            </section>

            {/* Methodology */}
            <section className="container mx-auto px-4 py-12 border-t border-border/30">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">Methodology</h2>
                  <p className="text-muted-foreground font-light">
                    How we model radical uncertainty in technological forecasting
                  </p>
                </div>
                <MethodologyAccordion methodology={methodology} />
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Detail Panel */}
      <EventDetailPanel
        event={selectedEvent}
        dependencyRules={dependencyRules}
        allEvents={events}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onEventClick={handleEventClick}
      />

      {/* Backdrop for panel */}
      {panelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}
