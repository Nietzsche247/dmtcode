import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Trial {
  id: string;
  title: string;
  start_date: string;
  institution: string;
  status: string;
}

const ActiveTrialsList = () => {
  const [trials, setTrials] = useState<Trial[]>([]);

  useEffect(() => {
    fetchActiveTrials();
  }, []);

  const fetchActiveTrials = async () => {
    const { data, error } = await supabase
      .from("clinical_trials")
      .select("id, title, start_date, institution, status")
      .in("status", ["active", "recruiting"])
      .order("start_date", { ascending: false })
      .limit(10);

    if (!error && data) {
      setTrials(data);
    }
  };

  if (trials.length === 0) {
    return <p className="text-sm text-muted-foreground">No active or recruiting trials</p>;
  }

  return (
    <div className="space-y-3">
      {trials.map((trial) => {
        const date = new Date(trial.start_date);
        const shortDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        return (
          <div key={trial.id} className="text-sm border-b border-border pb-2 last:border-0">
            <div className="font-semibold text-foreground truncate">{trial.title}</div>
            <div className="text-xs text-muted-foreground">
              {shortDate} • {trial.institution}
            </div>
            <div className="text-xs capitalize">
              <span className={trial.status === 'recruiting' ? 'text-[#60A5FA]' : 'text-[#2E5C8A]'}>
                {trial.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveTrialsList;
