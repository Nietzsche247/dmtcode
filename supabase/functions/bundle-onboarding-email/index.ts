import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sendEmail(to: string, subject: string, html: string): Promise<any> {
  const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
${html}
</body></html>`;

  return await resend.emails.send({
    from: "DMT Code <orders@dmtcode.com>",
    reply_to: "info@dmtcode.com",
    to: [to],
    subject,
    html: emailHtml,
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle Shopify webhook
    const shopifyTopic = req.headers.get("x-shopify-topic");
    console.log("Received webhook topic:", shopifyTopic);

    // Handle empty body (test pings from Shopify)
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === '') {
      console.log("Empty body received - likely a test ping");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook endpoint active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Shopify HMAC signature
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!hmacHeader) {
      return new Response(JSON.stringify({ error: "Missing HMAC signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bodyText));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
    if (computed !== hmacHeader) {
      console.warn("Invalid Shopify HMAC signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let order;
    try {
      order = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Order received:", order.id, order.email);

    const customerEmail = order.email;
    const customerName = order.customer?.first_name || "Researcher";
    const lineItems = order.line_items || [];

    if (!customerEmail) {
      console.error("No customer email in order");
      return new Response(
        JSON.stringify({ error: "No customer email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderName = String(order.name ?? order.order_number ?? order.id ?? "");
    const titles = lineItems.map((i: any) => String(i?.title ?? "")).filter((t: string) => t.trim()).join(", ");
    const subject = `Your DMT Code order ${orderName}: getting ready`;
    const lines = [
      "Thanks for your order.",
      `Your order: ${escapeHtml(titles)}`,
      "Orders are processed within 2 business days and usually arrive in 7 to 10 business days. Shipping within the US is free.",
      "Two things are worth doing before it arrives. Read the protocol guide: https://dmtcode.com/protocol-guide. Then download the free observation documents, including the field sheet and the sober baseline protocol: https://dmtcode.com/documents",
      "When you have an observation, record it at https://dmtcode.com/submit-symbol before you browse the symbol record, so your memory is not shaped by the catalogue.",
      "Laser safety: never look into the beam and never point it at anyone's eyes.",
      "Questions? Reply to this email or write to info@dmtcode.com.",
      "Meridian Optics Lab",
      "dmtcode.com",
    ];
    const result = await sendEmail(customerEmail, subject, lines.map((l) => `<p>${l}</p>`).join("\n"));
    console.log("Order email sent:", result);

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, emailSent: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
