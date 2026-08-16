// Admin-only reader for member email addresses.
// This is the ONLY path by which the browser sees an email address.
// Gate order is load-bearing: JWT -> caller resolution -> has_role('admin') -> listUsers.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentication required.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: 'Authentication required.' }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: isAdmin, error: roleError } = await admin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    // An rpc error is a denial, never a pass.
    if (roleError || isAdmin !== true) return json({ error: 'Admin role required.' }, 403);

    const perPage = 1000;
    let page = 1;
    const members: Array<{
      id: string;
      email: string | null;
      provider: string | null;
      email_confirmed: boolean;
      last_sign_in_at: string | null;
    }> = [];

    // Loop pages until a short page signals the end.
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      for (const u of users) {
        members.push({
          id: u.id,
          email: u.email ?? null,
          provider: (u.app_metadata as Record<string, unknown> | null)?.provider as string ?? null,
          email_confirmed: Boolean(u.email_confirmed_at),
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      }
      if (users.length < perPage) break;
      page += 1;
      if (page > 100) break; // hard stop
    }

    console.log(`admin-member-emails: admin=${user.id} records=${members.length}`);

    return json({ members });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected failure.';
    return json({ error: message }, 500);
  }
});
