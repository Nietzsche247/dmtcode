import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import TrialDetailModal from "./TrialDetailModal";
import { Skeleton } from "@/components/ui/skeleton";

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
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTrials();
  }, []);

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
              <h3 className="font-semibold text-foreground">{trial.title}</h3>
              <span 
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: statusColors[trial.status], color: 'white' }}
              >
                {trial.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{trial.institution}</p>
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
      <div className="overflow-x-auto pb-4" style={{ scrollBehavior: "smooth" }}>
        <div className="relative h-32 min-w-[2000px]" style={{ width: `${totalDays * 4}px` }}>
          {/* Today marker */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-[hsl(var(--gold))] z-10"
            style={{ left: `${(todayPosition / totalDays) * 100}%` }}
          />

          {/* Trial bars */}
          {trials.map((trial) => {
            const startDate = new Date(trial.start_date);
            const endDate = trial.end_date ? new Date(trial.end_date) : new Date();
            const startPos = daysSinceMin(startDate);
            const endPos = daysSinceMin(endDate);
            const leftPercent = (startPos / totalDays) * 100;
            const widthPercent = ((endPos - startPos) / totalDays) * 100;

            return (
              <div
                key={trial.id}
                className="absolute top-12 h-4 cursor-pointer hover:opacity-80 transition-opacity rounded group"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: statusColors[trial.status],
                }}
                onClick={() => setSelectedTrial(trial)}
              >
                {trial.status === 'completed' && (
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#28A745]"
                    style={{ boxShadow: '0 0 10px #28A745' }}
                  />
                )}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded px-2 py-1 whitespace-nowrap shadow-lg z-20">
                  <p className="text-xs font-semibold">{trial.title}</p>
                  <p className="text-xs text-muted-foreground">{trial.institution}</p>
                  <p className="text-xs capitalize">{trial.status}</p>
                </div>
              </div>
            );
          })}

          {/* Month/Year labels */}
          {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, i) => {
            const labelDate = new Date(minDate);
            labelDate.setMonth(labelDate.getMonth() + i);
            const position = daysSinceMin(labelDate);
            const leftPercent = (position / totalDays) * 100;

            return (
              <div
                key={i}
                className="absolute top-20 text-xs text-muted-foreground"
                style={{ left: `${leftPercent}%` }}
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
