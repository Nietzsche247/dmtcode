import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetreatColumnCard, { RetreatColumnRecord } from "./RetreatColumnCard";
import { Skeleton } from "@/components/ui/skeleton";

const RetreatColumnList = () => {
  const [retreats, setRetreats] = useState<RetreatColumnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("retreats")
        .select(
          "id,name,description,details,location,country,website_url,tags,next_start_date,next_end_date",
        )
        .eq("is_approved", true)
        .order("name", { ascending: true });
      if (error) console.error("Error fetching retreats:", error);
      else setRetreats((data as RetreatColumnRecord[]) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-52 w-full" />
        ))}
      </div>
    );
  }

  if (retreats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        No retreat centers listed yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {retreats.map((r) => (
        <RetreatColumnCard key={r.id} retreat={r} />
      ))}
    </div>
  );
};

export default RetreatColumnList;
