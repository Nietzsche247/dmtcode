import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';

interface VolunteerRow {
  id: string;
  handle: string | null;
  status: string;
  roles: string[];
  created_at: string;
  welcomed_at: string | null;
}

interface AuditRow {
  id: string;
  event_name: string;
  subject_type: string;
  subject_id: string | null;
  created_at: string;
}

const VolunteerDashboard = () => {
  const { loading: rolesLoading, userId, isAdmin, isModerator } = useRoles();
  const [volunteer, setVolunteer] = useState<VolunteerRow | null>(null);
  const [activity, setActivity] = useState<AuditRow[]>([]);
  const [pendingSymbols, setPendingSymbols] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rolesLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data: v } = await supabase
        .from('volunteers')
        .select('id, handle, status, roles, created_at, welcomed_at')
        .order('created_at', { ascending: false })
        .limit(1);
      setVolunteer((v?.[0] as VolunteerRow) ?? null);

      if (isModerator || isAdmin) {
        const { data: a } = await supabase
          .from('audit_events')
          .select('id, event_name, subject_type, subject_id, created_at')
          .eq('actor_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        setActivity((a as AuditRow[]) ?? []);

        const { count } = await supabase
          .from('symbol_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('moderation_status', 'unreviewed');
        setPendingSymbols(count ?? 0);
      }
      setLoading(false);
    };

    load();
  }, [rolesLoading, userId, isModerator, isAdmin]);

  const busy = rolesLoading || loading;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Volunteer dashboard | DMT Code</title>
        <meta name="description" content="Your volunteer status, review queues, and contribution history on DMT Code." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Volunteer</p>
          <h1 className="text-3xl font-bold">Your standing on this project</h1>
          <p className="text-muted-foreground">
            What you applied to, what access you currently hold, and what you have reviewed.
          </p>
        </header>

        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading
          </div>
        )}

        {!busy && !userId && (
          <Card className="p-6 space-y-3">
            <p>You are not signed in.</p>
            <Button asChild><Link to="/auth">Sign in</Link></Button>
          </Card>
        )}

        {!busy && userId && (
          <>
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Status</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant={volunteer ? 'default' : 'secondary'}>
                  {volunteer ? `Application: ${volunteer.status}` : 'No application on file'}
                </Badge>
                <Badge variant={isModerator || isAdmin ? 'default' : 'outline'}>
                  {isAdmin ? 'Administrator' : isModerator ? 'Reviewer access enabled' : 'Reviewer access not yet enabled'}
                </Badge>
              </div>
              {volunteer?.roles?.length ? (
                <p className="text-sm text-muted-foreground">
                  You offered to help with: {volunteer.roles.join(', ')}
                </p>
              ) : null}
              {volunteer && (
                <p className="text-xs text-muted-foreground">
                  Applied {new Date(volunteer.created_at).toLocaleDateString()}
                </p>
              )}
              {!isModerator && !isAdmin && (
                <p className="text-sm">
                  Reviewer access has not been switched on for this account yet. Nothing is required from you;
                  an administrator enables it manually.
                </p>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">What reviewing means here</h2>
              <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
                <li>You read incoming records and mark what stands, what is unclear, and what should be denied.</li>
                <li>Publication is not approval. A symbol is public the moment it is submitted. Your review records what a human actually looked at.</li>
                <li>You cannot delete anything. Every decision you make is logged and an administrator can reverse it.</li>
                <li>Recognition counts are not replication. Never describe them as confirmation.</li>
              </ul>
            </Card>

            {(isModerator || isAdmin) && (
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Your queues</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link to="/admin" className="rounded-md border border-border p-4 hover:bg-muted/40 transition-colors">
                    <p className="font-medium">Symbol submissions</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingSymbols === null ? 'Loading' : `${pendingSymbols} unreviewed`}
                    </p>
                  </Link>
                  <Link to="/admin" className="rounded-md border border-border p-4 hover:bg-muted/40 transition-colors">
                    <p className="font-medium">Article and event leads</p>
                    <p className="text-sm text-muted-foreground">Triage incoming sources</p>
                  </Link>
                </div>
              </Card>
            )}

            {(isModerator || isAdmin) && (
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Your recent decisions</h2>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {activity.map((a) => (
                      <li key={a.id} className="py-2 flex justify-between gap-4">
                        <span>{a.event_name.replace(/_/g, ' ')} <span className="text-muted-foreground">({a.subject_type})</span></span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default VolunteerDashboard;
