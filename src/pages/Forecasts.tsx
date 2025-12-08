import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { InteractiveTimeline } from "@/components/forecasts/InteractiveTimeline";
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

  // Cascade engine
  const {
    adjustedEvents,
    affectedEvents,
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
        <title>AI Timeline Forecasts 2026-2030 | DMT Code Project</title>
        <meta 
          name="description" 
          content="Interactive probabilistic model of 59 transformative AI events from 2026-2030. Drag events to simulate cascade effects." 
        />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-background pt-20">
        {/* Header */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4">
              AI Timeline
              <span className="text-primary"> 2026-2030</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto mb-4">
              Interactive Probability Model with Cascade Dependencies
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {format(new Date(lastUpdated), 'MMMM d, yyyy')}
              </p>
            )}
            <p className="text-sm text-muted-foreground/70 mt-2">
              {events.length} events · {dependencyRules.length} dependency rules · Drag primary events to simulate cascades
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
            {/* Scenario Controls */}
            <section className="container mx-auto px-4 py-4">
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

            {/* Timeline */}
            <section className="container mx-auto px-4 py-8">
              <div className="max-w-6xl mx-auto">
                <div className="bg-card/30 border border-border/50 rounded-xl p-6 overflow-hidden">
                  <InteractiveTimeline
                    events={events}
                    dependencyRules={dependencyRules}
                    showSecondaryEvents={showSecondaryEvents}
                    onEventClick={handleEventClick}
                    onEventDrag={handleEventDrag}
                    adjustedEvents={adjustedEvents}
                    affectedEvents={affectedEvents}
                  />
                </div>
              </div>
            </section>

            {/* Export */}
            <section className="container mx-auto px-4 py-8">
              <div className="max-w-6xl mx-auto">
                <ExportButtons events={events} methodology={methodology} />
              </div>
            </section>

            {/* Methodology */}
            <section className="container mx-auto px-4 py-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-foreground mb-6">Methodology</h2>
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
