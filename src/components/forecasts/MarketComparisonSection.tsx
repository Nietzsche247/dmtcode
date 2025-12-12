import { useMemo } from "react";
import type { ForecastEvent, MarketPrediction } from "@/lib/forecasts-api";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MarketComparisonSectionProps {
  events: ForecastEvent[];
  marketData: MarketPrediction[];
}

interface ComparisonItem {
  eventName: string;
  ourForecast: {
    year: number;
    quarter: string;
    probability: number;
  };
  metaculus: MarketPrediction[];
  polymarket: MarketPrediction[];
}

// Match market predictions to an event
function getEventMarketData(eventName: string, predictions: MarketPrediction[]): { metaculus: MarketPrediction[]; polymarket: MarketPrediction[] } {
  const eventLower = eventName.toLowerCase();
  
  const matches = predictions.filter(p => {
    const mappedLower = p.mapped_event_name.toLowerCase();
    
    // Direct match
    if (mappedLower === eventLower) return true;
    
    // AGI variations
    if ((eventLower.includes('agi') || eventLower.includes('human-level general')) && 
        (mappedLower.includes('agi') || mappedLower.includes('human-level general'))) {
      return true;
    }
    
    // Reasoning
    if (eventLower.includes('reasoning') && mappedLower.includes('reasoning')) return true;
    
    // Taiwan/China
    if ((eventLower.includes('taiwan') || eventLower.includes('china')) && 
        (mappedLower.includes('taiwan') || mappedLower.includes('china'))) {
      return true;
    }
    
    // Robots
    if (eventLower.includes('humanoid') && mappedLower.includes('humanoid')) return true;
    if ((eventLower.includes('robot') && eventLower.includes('1m')) && 
        (mappedLower.includes('robot') || mappedLower.includes('humanoid'))) {
      return true;
    }
    
    // UBI
    if (eventLower.includes('ubi') && mappedLower.includes('ubi')) return true;
    
    // Quantum
    if (eventLower.includes('quantum') && mappedLower.includes('quantum')) return true;
    
    return false;
  });
  
  return {
    metaculus: matches.filter(p => p.source === 'metaculus'),
    polymarket: matches.filter(p => p.source === 'polymarket')
  };
}

// Format quarter/year to readable string
function formatDate(year: number, quarter: string): string {
  return `${quarter} ${year}`;
}

// Get comparison icon based on difference
function getComparisonIcon(ourYear: number, marketYear: number | null) {
  if (!marketYear) return null;
  const diff = ourYear - marketYear;
  if (diff < -1) return <TrendingUp className="h-4 w-4 text-amber-500" />;
  if (diff > 1) return <TrendingDown className="h-4 w-4 text-emerald-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function MarketComparisonSection({ events, marketData }: MarketComparisonSectionProps) {
  // Find events with market data
  const comparisons = useMemo<ComparisonItem[]>(() => {
    const items: ComparisonItem[] = [];
    
    events.forEach(event => {
      const { metaculus, polymarket } = getEventMarketData(event.name, marketData);
      
      if (metaculus.length > 0 || polymarket.length > 0) {
        // Calculate weighted probability
        const totalProb = event.distributions.reduce((sum, d) => sum + d.probability, 0);
        const weightedProb = totalProb > 0 
          ? event.distributions.reduce((sum, d) => sum + d.probability, 0) / event.distributions.length * 100
          : event.probability;
        
        items.push({
          eventName: event.name,
          ourForecast: {
            year: event.medianYear,
            quarter: event.medianQuarter,
            probability: weightedProb
          },
          metaculus,
          polymarket
        });
      }
    });
    
    return items.sort((a, b) => a.ourForecast.year - b.ourForecast.year);
  }, [events, marketData]);

  if (comparisons.length === 0) return null;

  return (
    <div className="mt-8 border border-border/50 rounded-lg bg-card/30 backdrop-blur-sm">
      <div className="p-4 md:p-6 border-b border-border/50">
        <h3 className="text-lg font-semibold">Our Forecasts vs Market Consensus</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Comparing our probability-weighted forecasts against Metaculus community predictions and Polymarket betting odds
        </p>
      </div>
      
      {/* Methodology explanation */}
      <Accordion type="single" collapsible className="border-b border-border/50">
        <AccordionItem value="methodology" className="border-none">
          <AccordionTrigger className="px-4 md:px-6 py-3 text-sm font-medium hover:no-underline">
            How We Derive Our Forecasts vs. Market Methods
          </AccordionTrigger>
          <AccordionContent className="px-4 md:px-6 pb-4">
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Our Methodology</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Dependency-aware cascades:</strong> We model how breakthroughs in one domain accelerate or delay others (e.g., AGI unlocks robotics, Taiwan conflict delays chip supply).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Probability distributions:</strong> Each event has weighted probability across quarters, not just a point estimate.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Expert synthesis:</strong> We aggregate credible AI safety research, policy analysis, and technical capability assessments.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Falsifiability:</strong> Each forecast has explicit criteria that would prove it wrong.</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-500">Market Methods</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span><strong>Metaculus:</strong> Aggregates predictions from thousands of forecasters using reputation-weighted algorithms. Strong on long-term date predictions.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span><strong>Polymarket:</strong> Real-money betting market where traders stake capital on outcomes. Strong price discovery for near-term binary events.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span><strong>Wisdom of crowds:</strong> Markets aggregate dispersed information efficiently but can exhibit herding and recency bias.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span><strong>Liquidity constraints:</strong> Polymarket odds reflect trader capital, not necessarily probability. Metaculus has no financial incentive layer.</span>
                  </li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left p-3 md:p-4 font-medium">Event</th>
              <th className="text-center p-3 md:p-4 font-medium">Our Forecast</th>
              <th className="text-center p-3 md:p-4 font-medium text-orange-500">Metaculus</th>
              <th className="text-center p-3 md:p-4 font-medium text-emerald-500">Polymarket</th>
              <th className="text-center p-3 md:p-4 font-medium">Delta</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((item, idx) => {
              // Calculate average Metaculus year
              const metaculusAvgYear = item.metaculus.length > 0
                ? Math.round(item.metaculus.reduce((sum, m) => {
                    const date = new Date(m.median_date!);
                    return sum + date.getFullYear();
                  }, 0) / item.metaculus.length)
                : null;
              
              // Calculate year difference
              const yearDiff = metaculusAvgYear ? item.ourForecast.year - metaculusAvgYear : null;
              
              return (
                <tr 
                  key={item.eventName} 
                  className={cn(
                    "border-b border-border/30 hover:bg-muted/20 transition-colors",
                    idx % 2 === 0 && "bg-muted/5"
                  )}
                >
                  <td className="p-3 md:p-4 font-medium max-w-[200px]">
                    {item.eventName}
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    <div className="font-semibold text-primary">
                      {formatDate(item.ourForecast.year, item.ourForecast.quarter)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.min(95, Math.round(item.ourForecast.probability))}% confidence
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    {item.metaculus.length > 0 ? (
                      <div className="space-y-1">
                        {item.metaculus.map((m, i) => (
                          <a 
                            key={i}
                            href={m.source_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 text-orange-500 hover:underline"
                          >
                            <span className="font-medium">
                              {new Date(m.median_date!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                        <div className="text-xs text-muted-foreground">
                          {item.metaculus.reduce((sum, m) => sum + (m.forecaster_count || 0), 0).toLocaleString()} forecasters
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    {item.polymarket.length > 0 ? (
                      <div className="space-y-1">
                        {item.polymarket.map((p, i) => {
                          const prob = p.probability || 0;
                          const colorClass = prob < 10 ? 'bg-red-500' : prob < 30 ? 'bg-amber-500' : 'bg-emerald-500';
                          return (
                            <a 
                              key={i}
                              href={p.source_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1"
                            >
                              <span className={cn("px-2 py-0.5 rounded text-xs font-bold text-white", colorClass)}>
                                {prob.toFixed(1)}%
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                          );
                        })}
                        {item.polymarket.some(p => p.volume_usd) && (
                          <div className="text-xs text-muted-foreground">
                            ${item.polymarket.reduce((sum, p) => sum + (p.volume_usd || 0), 0).toLocaleString()} volume
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    {yearDiff !== null ? (
                      <div className="flex items-center justify-center gap-1">
                        {getComparisonIcon(item.ourForecast.year, metaculusAvgYear)}
                        <span className={cn(
                          "text-xs font-medium",
                          yearDiff > 0 ? "text-amber-500" : yearDiff < 0 ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                          {yearDiff > 0 ? `+${yearDiff}y` : yearDiff < 0 ? `${yearDiff}y` : 'aligned'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary insights */}
      <div className="p-4 md:p-6 bg-muted/20 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Key insight:</strong> Our forecasts tend to be more conservative on AGI timelines than Polymarket but align closely with Metaculus medians. 
          We weight geopolitical risk factors more heavily, resulting in earlier estimates for conflict-related cascades.
        </p>
      </div>
    </div>
  );
}
