import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TrialDetailModal from "./TrialDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import SharedTimeline, { TimelineItem } from "@/components/timeline/SharedTimeline";

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

const statusColors: Record<string, string> = {
  planned: "#9CA3AF",
  recruiting: "#60A5FA",
  active: "#2E5C8A",
  completed: "#28A745",
};

const TrialsTimeline = () => {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clinical_trials")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(200);
      if (error) console.error("Error fetching trials:", error);
      else setTrials(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="w-full h-32" />;

  const items: TimelineItem[] = trials.map((t) => ({
    id: t.id,
    date: t.start_date,
    title: t.title,
    subtitle: t.institution,
    badge: t.status,
    badgeColor: statusColors[t.status],
    onClick: () => setSelectedTrial(t),
  }));

  return (
    <>
      <SharedTimeline
        items={items}
        emptyLabel="No clinical trials yet. Submit one to get started."
        accentClassName="bg-primary"
      />
      <TrialDetailModal
        trial={selectedTrial}
        open={!!selectedTrial}
        onOpenChange={(open) => !open && setSelectedTrial(null)}
      />
    </>
  );
};

export default TrialsTimeline;
