import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
const SHOPIFY_STORE_DOMAIN = "5biatp-m0.myshopify.com";
const SHOPIFY_API_VERSION = "2025-01";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

interface ImageUploadRequest {
  productId: string;
  imageBase64: string;
  altText?: string;
  position?: number;
}

async function uploadImageToShopify(
  productId: string,
  imageBase64: string,
  altText: string = "",
  position: number = 1
): Promise<any> {
  const numericId = productId.replace("gid://shopify/Product/", "");
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${numericId}/images.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
    },
    body: JSON.stringify({
      image: {
        attachment: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        alt: altText,
        position: position,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Shopify API error:", errorText);
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Require admin role
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { productId, imageBase64, altText, position }: ImageUploadRequest = await req.json();

    // Validate productId (numeric or gid://shopify/Product/<numeric>)
    const numeric = String(productId ?? "").replace("gid://shopify/Product/", "");
    if (!/^\d{1,20}$/.test(numeric)) {
      return new Response(JSON.stringify({ error: "Invalid productId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripped = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    // Approximate decoded byte size
    const approxBytes = Math.floor(stripped.length * 0.75);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const alt = typeof altText === "string" ? altText.slice(0, 512) : "";
    const pos = Number.isInteger(position) ? Math.max(1, Math.min(50, position as number)) : 1;

    console.log(`Uploading image for product: ${numeric} (user ${userId})`);
    const result = await uploadImageToShopify(numeric, imageBase64, alt, pos);

    return new Response(
      JSON.stringify({
        success: true,
        imageId: result.image?.id,
        imageUrl: result.image?.src,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
