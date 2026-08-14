import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type Action = "grant_moderator" | "revoke_moderator" | "send_welcome";

const welcomeHtml = (handle: string, isModerator: boolean) => `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.6">
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#666">DMT Code</p>
  <h1 style="font-size:22px;margin:8px 0 16px">Thank you for volunteering, ${escapeHtml(handle)}</h1>
  <p>You applied to help with DMT Code. This note is a real person confirming your application was read, not an automated receipt.</p>
  <p><strong>What this project is testing.</strong> People report seeing discrete, structured visual forms, and they report the same forms without knowing each other. We do not yet know whether that convergence is real, or an artifact of shared expectation and shared imagery. The site exists to record the reports carefully enough that the question can be settled either way. We publish uncertainty rather than conclusions.</p>
  <p><strong>What you applied to.</strong> Volunteer review: reading incoming symbol records, article leads, and event submissions, and marking what is worth keeping. It is careful reading, not promotion.</p>
  ${
    isModerator
      ? `<p><strong>What happens next.</strong> Your account now has reviewer access. Sign in and open your volunteer dashboard at <a href="https://dmtcode.com/volunteer">dmtcode.com/volunteer</a> to see your queues and your review history. Nothing you do is destructive: every decision is logged and can be reversed by an administrator.</p>`
      : `<p><strong>What happens next.</strong> Sign in and open <a href="https://dmtcode.com/volunteer">dmtcode.com/volunteer</a> to see your application status. Reviewer access can be enabled for your account when you are ready.</p>`
  }
  <p>If anything on the site reads as overclaimed, say so. Critique is the contribution we value most.</p>
  <p style="margin-top:24px">Aaron<br/><span style="color:#666">DMT Code</span></p>
</div>`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    const { data: userData, error: userErr } = await service.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);
    const callerId = userData.user.id;

    const { data: isAdmin } = await service.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;
    const volunteerId = body.volunteerId as string | undefined;
    if (!volunteerId || !["grant_moderator", "revoke_moderator", "send_welcome"].includes(action)) {
      return json({ error: "Invalid request" }, 400);
    }

    const { data: volunteer, error: vErr } = await service
      .from("volunteers")
      .select("id, email, handle, status, user_id, welcomed_at")
      .eq("id", volunteerId)
      .maybeSingle();
    if (vErr || !volunteer) return json({ error: "Volunteer not found" }, 404);

    // Resolve the auth account for this volunteer by email.
    let targetUserId = volunteer.user_id as string | null;
    if (!targetUserId) {
      let page = 1;
      while (page <= 20 && !targetUserId) {
        const { data: list } = await service.auth.admin.listUsers({ page, perPage: 200 });
        const match = list?.users?.find(
          (u) => (u.email ?? "").toLowerCase() === String(volunteer.email).toLowerCase(),
        );
        if (match) targetUserId = match.id;
        if (!list?.users?.length || list.users.length < 200) break;
        page += 1;
      }
      if (targetUserId) {
        await service.from("volunteers").update({ user_id: targetUserId }).eq("id", volunteerId);
      }
    }

    if (action === "grant_moderator" || action === "revoke_moderator") {
      if (!targetUserId) {
        return json(
          { error: "No account found for this email. Ask them to sign up first, then grant access." },
          409,
        );
      }
      if (action === "grant_moderator") {
        const { error } = await service
          .from("user_roles")
          .insert({ user_id: targetUserId, role: "moderator" });
        if (error && !String(error.message).includes("duplicate")) {
          return json({ error: error.message }, 400);
        }
      } else {
        const { error } = await service
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "moderator");
        if (error) return json({ error: error.message }, 400);
      }

      await service.from("audit_events").insert({
        event_name: action,
        actor_id: callerId,
        actor_kind: "admin",
        subject_type: "volunteer",
        subject_id: volunteerId,
        properties: { target_user_id: targetUserId, email: volunteer.email },
      });

      return json({ ok: true, userId: targetUserId });
    }

    // send_welcome
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "Email is not configured" }, 500);

    let isModerator = false;
    if (targetUserId) {
      const { data: mod } = await service.rpc("has_role", {
        _user_id: targetUserId,
        _role: "moderator",
      });
      isModerator = Boolean(mod);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DMT Code <notifications@dmtcode.com>",
        to: [volunteer.email],
        subject: "Your DMT Code volunteer application",
        html: welcomeHtml(volunteer.handle || "there", isModerator),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend failed", detail);
      return json({ error: "Email send failed", detail }, 502);
    }

    await service
      .from("volunteers")
      .update({ welcomed_at: new Date().toISOString(), status: "contacted" })
      .eq("id", volunteerId);

    await service.from("audit_events").insert({
      event_name: "volunteer_welcome_sent",
      actor_id: callerId,
      actor_kind: "admin",
      subject_type: "volunteer",
      subject_id: volunteerId,
      properties: { email: volunteer.email, moderator: isModerator },
    });

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
