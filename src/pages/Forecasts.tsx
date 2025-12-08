import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { ForecastEventCard } from "@/components/forecasts/ForecastEventCard";
import { ExportButtons } from "@/components/forecasts/ExportButtons";
import { MethodologyAccordion } from "@/components/forecasts/MethodologyAccordion";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getForecasts, 
  getMethodology, 
  processForecasts,
  type ForecastEvent,
  type Methodology 
} from "@/lib/forecasts-api";
import { format } from "date-fns";

export default function Forecasts() {
  const [events, setEvents] = useState<ForecastEvent[]>([]);
  const [methodology, setMethodology] = useState<Methodology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [forecastsData, methodologyData] = await Promise.all([
          getForecasts(),
          getMethodology()
        ]);
        
        if (forecastsData.length > 0) {
          const processedEvents = processForecasts(forecastsData);
          setEvents(processedEvents);
          
          // Get most recent update
          const latestUpdate = forecastsData.reduce((latest, f) => {
            const fDate = new Date(f.updated_at);
            return fDate > new Date(latest) ? f.updated_at : latest;
          }, forecastsData[0].updated_at);
          setLastUpdated(latestUpdate);
        }
        
        setMethodology(methodologyData);
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
        <title>Technology Forecasts 2025-2035 | DMT Code Project</title>
        <meta 
          name="description" 
          content="Probabilistic model of transformative technology events from 2025-2035. Bayesian probability distributions with conditional dependencies." 
        />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-background pt-20">
        {/* Header Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4">
              Technology Forecasts
              <span className="text-primary"> 2025-2035</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto mb-4">
              Probabilistic Model of Transformative Events
            </p>
            
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {format(new Date(lastUpdated), 'MMMM d, yyyy')}
              </p>
            )}
            
            <p className="text-sm text-muted-foreground/70 mt-2 max-w-xl mx-auto">
              Bayesian probability distributions with conditional dependencies. 
              See methodology below for details.
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

        {/* Loading State */}
        {loading && (
          <section className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card/50 border border-border/50 rounded-lg p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Event Cards Grid */}
        {!loading && !error && events.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                10-Event Probability Model
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {events.map((event, index) => (
                  <ForecastEventCard 
                    key={event.name} 
                    event={event}
                    onClick={() => {
                      // TODO: Open detail modal
                      console.log('Event clicked:', event.name);
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* No Data State */}
        {!loading && !error && events.length === 0 && (
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-secondary/30 border border-border/50 rounded-lg p-8">
                <p className="text-lg text-muted-foreground mb-2">
                  No forecast data available yet.
                </p>
                <p className="text-sm text-muted-foreground/70">
                  The external database may not be configured or populated.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Export Section */}
        {!loading && events.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Data Export
              </h2>
              <ExportButtons events={events} methodology={methodology} />
            </div>
          </section>
        )}

        {/* Methodology Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Methodology
            </h2>
            <MethodologyAccordion methodology={methodology} />
          </div>
        </section>

        {/* Footer Info */}
        <section className="container mx-auto px-4 py-8 border-t border-border/30">
          <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
            <p>Model maintained by Aaron Baker</p>
            <p className="mt-1">
              Questions? <a href="/about" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
