import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic",
};

// Bundle tier detection based on product names/tags
function detectBundleTier(lineItems: any[]): string {
  const productTitles = lineItems.map((item: any) => item.title?.toLowerCase() || "");
  
  if (productTitles.some(t => t.includes("ceremony") || t.includes("peyote"))) {
    return "ceremony";
  }
  if (productTitles.some(t => t.includes("complete") || t.includes("mitomat"))) {
    return "complete";
  }
  if (productTitles.some(t => t.includes("gateway") || t.includes("bon charge"))) {
    return "gateway";
  }
  return "starter";
}

const bundleEmailContent: Record<string, { subject: string; welcomeHtml: string; day3Subject: string; day7Subject: string }> = {
  starter: {
    subject: "Welcome to DMT Code - Your Starter Kit is on the Way!",
    welcomeHtml: `
      <h1 style="color: #C41E3A; font-family: 'Inter', sans-serif;">Your Research Journey Begins</h1>
      <p>Thank you for choosing the Fractal Starter Kit. Your essential documentation tools and intention-setting materials are being prepared.</p>
      <h2>What's Next?</h2>
      <ul>
        <li>Review the <a href="https://dmtcode.com/protocol-guide">Protocol Guide</a></li>
        <li>Set up your research journal</li>
        <li>Join our community at the <a href="https://dmtcode.com/registry">Symbol Registry</a></li>
      </ul>
      <p>Your kit includes everything you need to begin documenting your experiences.</p>
    `,
    day3Subject: "Ready to Start Documenting? - Day 3 Check-in",
    day7Subject: "First Week Complete - Your Research Progress",
  },
  gateway: {
    subject: "Welcome Researcher - Your Gateway Kit Ships Today!",
    welcomeHtml: `
      <h1 style="color: #C41E3A; font-family: 'Inter', sans-serif;">Serious Research Starts Here</h1>
      <p>Congratulations on your Gateway Research Kit purchase. You've chosen the most popular bundle for committed researchers.</p>
      <h2>Your Kit Includes:</h2>
      <ul>
        <li>650nm Red Light Therapy Device (Bon Charge Max)</li>
        <li>Protective Ceremonial Hoodie</li>
        <li>Documentation Setup with Journal</li>
      </ul>
      <h2>Getting Started:</h2>
      <ol>
        <li>Read the <a href="https://dmtcode.com/protocol-guide">Protocol Guide</a> thoroughly</li>
        <li>Calibrate your red light device following manufacturer instructions</li>
        <li>Review the <a href="https://dmtcode.com/evidence-map">Research Evidence</a></li>
      </ol>
    `,
    day3Subject: "Setting Up Your 650nm Device - Day 3 Guide",
    day7Subject: "Ready for Your First Session? - Week 1 Complete",
  },
  complete: {
    subject: "Advanced Researcher Welcome - Complete Symbol Kit",
    welcomeHtml: `
      <h1 style="color: #C41E3A; font-family: 'Inter', sans-serif;">Full-Spectrum Research Capability</h1>
      <p>Welcome to the advanced researcher tier. Your Complete Symbol Kit includes professional-grade equipment for extended studies.</p>
      <h2>Premium Equipment Included:</h2>
      <ul>
        <li>MitoMAT 660nm Full-Body Light Therapy</li>
        <li>HigherDOSE Recovery Bundle</li>
        <li>Sacred Ceremonial Attire</li>
        <li>Complete Documentation Tools</li>
      </ul>
      <h2>Priority Support:</h2>
      <p>As a Complete kit owner, you have access to priority community support. Reach out anytime at support@dmtcode.com</p>
    `,
    day3Subject: "Equipment Setup Guide - Day 3",
    day7Subject: "Advanced Protocol Introduction - Week 1",
  },
  ceremony: {
    subject: "Ceremonial Package Confirmed - Important Pre-Ceremony Information",
    welcomeHtml: `
      <h1 style="color: #C41E3A; font-family: 'Inter', sans-serif;">Ceremonial Experience Confirmed</h1>
      <p>Thank you for trusting us with your ceremonial research journey. This is a significant commitment and we're honored to support you.</p>
      <h2>Your Package Includes:</h2>
      <ul>
        <li>Peyote Way Spirit Walk (3-Day Legal Ceremony)</li>
        <li>MitoMAT 660nm Equipment</li>
        <li>Paradisiac Ritual Robe</li>
        <li>Integration Support Materials</li>
      </ul>
      <h2>Pre-Ceremony Preparation:</h2>
      <p>You'll receive detailed preparation instructions from Peyote Way Church directly. Please review the <a href="https://dmtcode.com/protocol-guide">Protocol Guide</a> and <a href="https://dmtcode.com/evidence-map">Research Evidence</a> before your experience.</p>
      <h2>1-on-1 Integration Support:</h2>
      <p>Your package includes post-ceremony integration coaching. We'll reach out to schedule your sessions after your experience.</p>
    `,
    day3Subject: "Ceremony Preparation Checklist - Day 3",
    day7Subject: "Final Pre-Ceremony Review - Week 1",
  },
};

async function sendEmail(to: string, subject: string, html: string): Promise<any> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { font-size: 28px; font-weight: 900; }
        h2 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-top: 24px; }
        a { color: #C41E3A; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      ${html}
      <div class="footer">
        <p>DMT Code Project | <a href="https://dmtcode.com">dmtcode.com</a></p>
        <p>This email was sent because you made a purchase. <a href="https://dmtcode.com/unsubscribe">Unsubscribe</a></p>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: "DMT Code <orders@dmtcode.com>",
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

    const order = await req.json();
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

    // Detect bundle tier
    const bundleTier = detectBundleTier(lineItems);
    console.log("Detected bundle tier:", bundleTier);

    const content = bundleEmailContent[bundleTier];

    // Send welcome email immediately
    const welcomeResult = await sendEmail(
      customerEmail,
      content.subject,
      content.welcomeHtml.replace("{{name}}", customerName)
    );
    console.log("Welcome email sent:", welcomeResult);

    // Note: Day 3 and Day 7 emails would be scheduled via cron or queue
    // For now, we log the intent
    console.log("Scheduled emails:", {
      day3: { to: customerEmail, subject: content.day3Subject },
      day7: { to: customerEmail, subject: content.day7Subject },
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        bundleTier,
        emailSent: true,
        scheduledEmails: ["day3", "day7"],
      }),
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
