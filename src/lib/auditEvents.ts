import { supabase } from '@/integrations/supabase/client';

/**
 * Append-only audit trail for operator decisions.
 *
 * This is deliberately a database write, not a third-party analytics call.
 * The canonical consumer is an agent reading Postgres over SQL, and the
 * moderation record needs to outlive any analytics vendor. Insert-only by
 * policy: there is no update or delete path, so the trail cannot be rewritten.
 *
 * Recording an event must never block or fail the operator action it describes.
 * A failed audit write is logged and surfaced nowhere else.
 */
export type AuditEvent = {
  event_name: string;
  subject_type: string;
  subject_id?: string | null;
  properties?: Record<string, unknown>;
};

export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const actorId = auth?.user?.id;
    if (!actorId) return;

    const { error } = await supabase.from('audit_events').insert([
      {
        event_name: event.event_name,
        actor_id: actorId,
        actor_kind: 'admin',
        subject_type: event.subject_type,
        subject_id: event.subject_id ?? undefined,
        properties: (event.properties ?? {}) as never,
      },
    ]);
    if (error) console.error('audit event not recorded:', event.event_name, error.message);
  } catch (e) {
    console.error('audit event not recorded:', event.event_name, e);
  }
}

/** Records one row per affected subject so bulk actions stay per-record auditable. */
export async function recordAuditEvents(
  ids: string[],
  base: Omit<AuditEvent, 'subject_id'>,
): Promise<void> {
  await Promise.all(ids.map((id) => recordAuditEvent({ ...base, subject_id: id })));
}
