import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetreatCard from "./RetreatCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Retreat {
  id: string;
  name: string;
  description: string | null;
  location: string;
  country: string | null;
  image_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  tags: string[];
}

const RetreatGrid = () => {
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRetreats();
  }, []);

  const fetchRetreats = async () => {
    const { data, error } = await supabase
      .from("retreats")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching retreats:", error);
    } else {
      setRetreats(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    );
  }

  if (retreats.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No retreats yet. Be the first to submit one!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {retreats.map((retreat) => (
        <RetreatCard key={retreat.id} retreat={retreat} />
      ))}
    </div>
  );
};

export default RetreatGrid;
