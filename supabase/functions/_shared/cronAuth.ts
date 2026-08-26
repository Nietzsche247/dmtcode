// Shared gate for machine-triggered edge functions.
// Accepts a per-function secret header, falling back to INTEL_CRON_SECRET so
// existing cron jobs keep working until the per-function secrets are set.
// Never log or return secret values.
import { createClient } from "npm:@supabase/supabase-js@2";

type Cors = Record<string, string>;

export function acceptedSecrets(specificEnvVar: string): string[] {
  return [Deno.env.get(specificEnvVar), Deno.env.get("INTEL_CRON_SECRET")]
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

export function unauthorized(corsHeaders: Cors): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Pure machine gate: shared-secret header only. Returns a 401 Response when
// the request is not authorized, null when it may proceed.
export function machineAuthError(
  req: Request,
  specificEnvVar: string,
  headerName: string,
  corsHeaders: Cors,
): Response | null {
  const accepted = acceptedSecrets(specificEnvVar);
  const provided = req.headers.get(headerName);
  if (accepted.length === 0 || !provided || !accepted.includes(provided)) {
    return unauthorized(corsHeaders);
  }
  return null;
}

// Dual path: shared-secret header OR an authenticated admin user JWT.
// Used by scrapers that also have "Run Now" buttons in the admin UI.
export async function adminOrMachineAuthError(
  req: Request,
  specificEnvVar: string,
  headerName: string,
  corsHeaders: Cors,
): Promise<Response | null> {
  const accepted = acceptedSecrets(specificEnvVar);
  const provided = req.headers.get(headerName);
  if (provided && accepted.length > 0 && accepted.includes(provided)) {
    return null;
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await userClient.auth.getClaims(token);
      if (!error && data?.claims?.sub) {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data: isAdmin } = await adminClient.rpc("has_role", {
          _user_id: data.claims.sub,
          _role: "admin",
        });
        if (isAdmin) return null;
      }
    } catch (e) {
      console.error("Admin auth check failed:", e);
    }
  }
  return unauthorized(corsHeaders);
}
