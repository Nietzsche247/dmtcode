import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Volunteer {
  id: string;
  handle: string | null;
  email: string;
  roles: string[];
  experience_level: string | null;
  languages: string[] | null;
  skills: string | null;
  why: string | null;
  consent_contact: boolean;
  status: string;
  created_at: string;
  user_id: string | null;
  welcomed_at: string | null;
}


const STATUSES = ['new', 'contacted', 'active', 'declined'];

export const VolunteersModeration = () => {
  const [rows, setRows] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderatorIds, setModeratorIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load volunteers', { description: error.message });
    } else {
      setRows((data as Volunteer[]) ?? []);
    }
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'moderator');
    setModeratorIds(new Set((roles ?? []).map((r) => r.user_id as string)));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('volunteers').update({ status }).eq('id', id);
    if (error) {
      toast.error('Update failed', { description: error.message });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Marked ${status}`);
  };

  const runAction = async (
    volunteerId: string,
    action: 'grant_moderator' | 'revoke_moderator' | 'send_welcome',
  ) => {
    setBusyId(volunteerId);
    const { data, error } = await supabase.functions.invoke('volunteer-access', {
      body: { volunteerId, action },
    });
    setBusyId(null);

    const failure = error?.message || (data as { error?: string } | null)?.error;
    if (failure) {
      toast.error('Action failed', { description: failure });
      return;
    }
    toast.success(
      action === 'send_welcome'
        ? 'Welcome email sent'
        : action === 'grant_moderator'
          ? 'Reviewer access granted'
          : 'Reviewer access revoked',
    );
    load();
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground py-8">No volunteer submissions yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Volunteers ({rows.length})</h2>
        <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
      </div>
      <div className="space-y-3">
        {rows.map((v) => (
          <div key={v.id} className="rounded-md border border-border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{v.handle ?? '-'} <span className="text-muted-foreground text-sm font-normal">({v.email})</span></p>
                <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {v.user_id && moderatorIds.has(v.user_id) && (
                  <Badge variant="outline" className="text-xs">reviewer access</Badge>
                )}
                {v.welcomed_at && (
                  <Badge variant="outline" className="text-xs">welcomed</Badge>
                )}
                <Badge variant={v.status === 'new' ? 'default' : 'secondary'}>{v.status}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {v.roles.map((r) => (
                <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
              ))}
            </div>
            {v.experience_level && <p className="text-sm"><span className="text-muted-foreground">Experience:</span> {v.experience_level}</p>}
            {v.languages && v.languages.length > 0 && <p className="text-sm"><span className="text-muted-foreground">Languages:</span> {v.languages.join(', ')}</p>}
            {v.skills && <p className="text-sm"><span className="text-muted-foreground">Skills:</span> {v.skills}</p>}
            {v.why && <p className="text-sm text-foreground/90 italic">"{v.why}"</p>}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={v.status === s ? 'default' : 'outline'}
                  onClick={() => setStatus(v.id, s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="secondary"
                disabled={busyId === v.id}
                onClick={() => runAction(v.id, 'send_welcome')}
              >
                {v.welcomed_at ? 'Resend welcome email' : 'Send welcome email'}
              </Button>
              {v.user_id && moderatorIds.has(v.user_id) ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === v.id}
                  onClick={() => runAction(v.id, 'revoke_moderator')}
                >
                  Revoke reviewer access
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === v.id}
                  onClick={() => runAction(v.id, 'grant_moderator')}
                >
                  Grant reviewer access
                </Button>
              )}
              {busyId === v.id && <Loader2 className="w-4 h-4 animate-spin self-center" />}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
