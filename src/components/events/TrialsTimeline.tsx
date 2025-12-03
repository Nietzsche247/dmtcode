import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import TrialDetailModal from "./TrialDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";

interface ClinicalTrial {
  id: string;
  title: string;
  description: string | null;
  institution: string;
  principal_investigator: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  trial_registry_id: string | null;
  doi: string | null;
  url: string | null;
}

const statusColors = {
  planned: '#9CA3AF', // light grey
  recruiting: '#60A5FA', // medium blue
  active: '#2E5C8A', // dark blue
  completed: '#28A745', // green
};

const TrialsTimeline = () => {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTrials();
  }, []);

  useEffect(() => {
    if (!isMobile && trials.length > 0) {
      setShowScrollHint(true);
      const timer = setTimeout(() => setShowScrollHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, trials.length]);

  const fetchTrials = async () => {
    const { data, error } = await supabase
      .from("clinical_trials")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Error fetching trials:", error);
    } else {
      setTrials(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <Skeleton className="w-full h-32" />;
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {trials.map((trial) => (
          <Card
            key={trial.id}
            className="p-4 cursor-pointer hover:border-[#2E5C8A] transition-colors"
            onClick={() => setSelectedTrial(trial)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-foreground uppercase tracking-tight text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{trial.title}</h3>
              <div className="flex items-center gap-2">
                <ShareButtons title={trial.title} description={trial.institution} className="ml-2" />
                <span 
                  className="text-xs px-2 py-1 rounded whitespace-nowrap"
                  style={{ backgroundColor: statusColors[trial.status], color: 'white' }}
                >
                  {trial.status}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-light" style={{ fontWeight: 300 }}>{trial.institution}</p>
          </Card>
        ))}
        {trials.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No clinical trials yet. Be the first to submit one!
          </p>
        )}
        <TrialDetailModal
          trial={selectedTrial}
          open={!!selectedTrial}
          onOpenChange={(open) => !open && setSelectedTrial(null)}
        />
      </div>
    );
  }

  const today = new Date();
  const minDate = trials.length > 0 
    ? new Date(Math.min(...trials.map(t => new Date(t.start_date).getTime())))
    : new Date(today.getFullYear() - 1, 0, 1);
  const maxDate = trials.length > 0
    ? new Date(Math.max(...trials.map(t => new Date(t.end_date || t.start_date).getTime())))
    : new Date(today.getFullYear() + 1, 11, 31);

  const daysSinceMin = (date: Date) => 
    Math.floor((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const totalDays = daysSinceMin(maxDate) + 30;
  const todayPosition = daysSinceMin(today);

  return (
    <div className="relative">
      {/* Scroll hint */}
      {showScrollHint && !isMobile && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/95 backdrop-blur border border-border rounded px-3 py-1.5 shadow-lg">
            <ChevronLeft className="w-4 h-4" />
            <span>scroll for more</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4" style={{ scrollBehavior: "smooth" }}>
        <div className="relative min-w-[2000px]" style={{ width: `${totalDays * 4}px`, height: '180px' }}>
          {/* Color-coded horizontal bar - taller */}
          <div className="absolute w-full bg-gradient-to-r from-gray-500 via-blue-500 to-green-600" style={{ top: '40px', height: '100px' }} />

          {/* Today marker - 4px thick with soft glow */}
          <div 
            className="absolute top-0 h-full w-1 bg-[hsl(var(--gold))] z-10"
            style={{ 
              left: `${(todayPosition / totalDays) * 100}%`,
              boxShadow: '0 0 12px hsl(var(--gold) / 0.5)'
            }}
          />

          {/* Trial bars with inline labels */}
          {trials.map((trial) => {
            const startDate = new Date(trial.start_date);
            const endDate = trial.end_date ? new Date(trial.end_date) : new Date();
            const startPos = daysSinceMin(startDate);
            const endPos = daysSinceMin(endDate);
            const leftPercent = (startPos / totalDays) * 100;
            const widthPercent = ((endPos - startPos) / totalDays) * 100;
            const truncatedTitle = trial.title.length > 35 ? trial.title.substring(0, 35) + '…' : trial.title;
            const shortDate = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            return (
              <div
                key={trial.id}
                className="absolute cursor-pointer hover:opacity-80 transition-opacity rounded group"
                style={{
                  left: `${leftPercent}%`,
                  width: `${Math.max(widthPercent, 2)}%`,
                  backgroundColor: statusColors[trial.status],
                  top: '40px',
                  height: '100px'
                }}
                onClick={() => setSelectedTrial(trial)}
              >
                {trial.status === 'completed' && (
                  <div 
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#28A745]"
                    style={{ boxShadow: '0 0 10px #28A745' }}
                  />
                )}
                {/* Inline label on bar - always visible */}
                <div 
                  className="absolute top-2 left-2 right-2 text-white pointer-events-none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  <div className="text-sm font-black uppercase tracking-tight truncate" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{truncatedTitle}</div>
                  <div className="text-xs font-light truncate" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}>{shortDate} · {trial.institution.substring(0, 25)}</div>
                </div>
              </div>
            );
          })}

          {/* Month/Year labels at bottom */}
          {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, i) => {
            if (typeof window !== 'undefined' && window.innerWidth < 768 && i % 2 !== 0) {
              return null;
            }

            const labelDate = new Date(minDate);
            labelDate.setMonth(labelDate.getMonth() + i);
            const position = daysSinceMin(labelDate);
            const leftPercent = (position / totalDays) * 100;

            return (
              <div
                key={i}
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${leftPercent}%`, top: '150px' }}
              >
                {labelDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            );
          })}
        </div>
      </div>

      {trials.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No clinical trials yet. Be the first to submit one!
        </p>
      )}

      <TrialDetailModal
        trial={selectedTrial}
        open={!!selectedTrial}
        onOpenChange={(open) => !open && setSelectedTrial(null)}
        />
    </div>
  );
};

export default TrialsTimeline;
