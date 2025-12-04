import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BundlePurchaseRequest {
  email: string;
  customerName: string;
  bundleType: 'starter' | 'gateway' | 'complete' | 'ceremony';
  orderId: string;
}

const bundleContent = {
  starter: {
    name: 'Fractal Starter Kit',
    welcomeSubject: 'Welcome to the DMT Code Project - Your Starter Kit is on its way!',
    day3Subject: 'Getting Started with Your 650nm Laser Protocol',
    day7Subject: 'Ready to Submit Your First Symbol?',
    welcomeContent: `
      <h1>Welcome to the DMT Code Project!</h1>
      <p>Thank you for joining our research community with the Fractal Starter Kit.</p>
      <h2>What's in Your Kit:</h2>
      <ul>
        <li>650nm Red Laser Pointer (5mW calibrated)</li>
        <li>Diffraction Grating Set</li>
        <li>Research Protocol Guide</li>
      </ul>
      <p>Your kit will arrive within 5-7 business days. In the meantime, we recommend:</p>
      <ol>
        <li>Reading the <a href="https://dmtcode.com/protocol-guide">Protocol Guide</a></li>
        <li>Familiarizing yourself with the <a href="https://dmtcode.com/registry">Glyph Registry</a></li>
        <li>Reviewing the <a href="https://dmtcode.com/evidence-map">Evidence Map</a></li>
      </ol>
    `,
    day3Content: `
      <h1>Getting Started with Your Protocol</h1>
      <p>Your Fractal Starter Kit should be arriving soon! Here's how to prepare:</p>
      <h2>Pre-Session Checklist:</h2>
      <ul>
        <li>Choose a dark, quiet environment</li>
        <li>Set up your laser on a stable surface</li>
        <li>Have the diffraction grating ready</li>
        <li>Keep a drawing pad nearby for immediate symbol capture</li>
      </ul>
      <p>Remember: The key to valid data is capturing symbols within 60 seconds of observation.</p>
      <p><a href="https://dmtcode.com/methods">Read our methodology guide</a></p>
    `,
    day7Content: `
      <h1>Ready to Contribute?</h1>
      <p>By now you should have your Fractal Starter Kit and be ready for your first session.</p>
      <h2>Submit Your First Symbol:</h2>
      <p>Visit our <a href="https://dmtcode.com/registry">Glyph Registry</a> to submit any symbols you observe.</p>
      <p>Even "null reports" (seeing nothing unusual) are valuable data!</p>
      <p><a href="https://dmtcode.com/null-reports">Learn about null reports</a></p>
    `
  },
  gateway: {
    name: 'Gateway Research Kit',
    welcomeSubject: 'Welcome to Advanced Research - Your Gateway Kit is on its way!',
    day3Subject: 'Advanced Protocols for Your Gateway Kit',
    day7Subject: 'Join Our Research Community',
    welcomeContent: `
      <h1>Welcome to Advanced Research!</h1>
      <p>Thank you for your commitment to the DMT Code Project with the Gateway Research Kit.</p>
      <h2>Your Professional Kit Includes:</h2>
      <ul>
        <li>Calibrated 650nm Laser Module</li>
        <li>Professional Diffraction Array</li>
        <li>ZnSe Focus Lens Set</li>
        <li>Extended Protocol Documentation</li>
      </ul>
      <p>As a Gateway researcher, you have access to our extended methodology documentation.</p>
    `,
    day3Content: `
      <h1>Advanced Protocol Training</h1>
      <p>Your Gateway Research Kit enables more sophisticated optical experiments.</p>
      <h2>Advanced Techniques:</h2>
      <ul>
        <li>Multi-wavelength comparison studies</li>
        <li>Refractive index experiments</li>
        <li>Extended session documentation</li>
      </ul>
      <p><a href="https://dmtcode.com/evidence-map">Review the latest research findings</a></p>
    `,
    day7Content: `
      <h1>Join the Research Community</h1>
      <p>Connect with other Gateway researchers and contribute to our growing database.</p>
      <p>Your submissions help build the largest open repository of visual symbol data.</p>
    `
  },
  complete: {
    name: 'Complete Symbol Kit',
    welcomeSubject: 'Welcome to Comprehensive Research - Your Complete Kit is on its way!',
    day3Subject: 'Mastering Your Complete Symbol Kit',
    day7Subject: 'Your Research Impact',
    welcomeContent: `
      <h1>Welcome to Comprehensive Research!</h1>
      <p>The Complete Symbol Kit represents our most thorough research package.</p>
      <h2>Your Comprehensive Kit Includes:</h2>
      <ul>
        <li>Full Optical Array (multiple wavelengths)</li>
        <li>Complete Lens Collection</li>
        <li>Digital Documentation Tools</li>
        <li>Priority Registry Access</li>
      </ul>
    `,
    day3Content: `
      <h1>Maximizing Your Research</h1>
      <p>With the Complete Symbol Kit, you can conduct multi-variable experiments.</p>
      <h2>Research Pathways:</h2>
      <ul>
        <li>Wavelength comparison studies</li>
        <li>Environmental variable tracking</li>
        <li>Cross-session correlation analysis</li>
      </ul>
    `,
    day7Content: `
      <h1>Your Contributions Matter</h1>
      <p>Complete Kit researchers provide the most detailed data in our registry.</p>
      <p>Consider contributing to our <a href="https://dmtcode.com/correlations">correlations research</a>.</p>
    `
  },
  ceremony: {
    name: 'Extended Ceremony Package',
    welcomeSubject: 'Welcome to the Extended Ceremony Package - Premium Research Awaits',
    day3Subject: 'Preparing for Extended Research Sessions',
    day7Subject: 'Integration Support Available',
    welcomeContent: `
      <h1>Welcome to Extended Research!</h1>
      <p>The Extended Ceremony Package provides everything for comprehensive, extended research.</p>
      <h2>Your Premium Package Includes:</h2>
      <ul>
        <li>Complete Optical Research Array</li>
        <li>Biohacking Equipment Suite</li>
        <li>Red Light Therapy Components</li>
        <li>1-on-1 Integration Coaching Session</li>
        <li>Lifetime Registry Access</li>
      </ul>
      <p>A member of our team will reach out to schedule your integration coaching session.</p>
    `,
    day3Content: `
      <h1>Extended Session Preparation</h1>
      <p>Your Ceremony Package enables multi-hour research sessions.</p>
      <h2>Preparation Guidelines:</h2>
      <ul>
        <li>Set aside 4-6 hours for extended sessions</li>
        <li>Use the red light therapy equipment beforehand</li>
        <li>Have documentation tools ready</li>
      </ul>
    `,
    day7Content: `
      <h1>Integration Support</h1>
      <p>Don't forget - your package includes a 1-on-1 integration coaching session.</p>
      <p>Reply to this email to schedule your session with one of our researchers.</p>
      <p>Integration support helps process and contextualize your research experiences.</p>
    `
  }
};

async function sendEmail(to: string, subject: string, html: string) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #1e3a8a; font-size: 24px; }
        h2 { color: #4b5563; font-size: 18px; margin-top: 24px; }
        a { color: #C41E3A; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      ${html}
      <div class="footer">
        <p>DMT Code Project - Open Research Initiative</p>
        <p><a href="https://dmtcode.com">dmtcode.com</a> | <a href="https://dmtcode.com/registry">Glyph Registry</a> | <a href="https://dmtcode.com/evidence-map">Evidence Map</a></p>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: "DMT Code Project <onboarding@resend.dev>",
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
    const { email, customerName, bundleType, orderId }: BundlePurchaseRequest = await req.json();
    
    console.log(`Processing bundle purchase email for ${email}, bundle: ${bundleType}, order: ${orderId}`);

    const bundle = bundleContent[bundleType];
    if (!bundle) {
      throw new Error(`Unknown bundle type: ${bundleType}`);
    }

    const welcomeResult = await sendEmail(
      email,
      bundle.welcomeSubject,
      bundle.welcomeContent.replace('{{name}}', customerName || 'Researcher')
    );
    
    console.log("Welcome email sent:", welcomeResult);

    const emailSchedule = {
      welcome: { sent: true, id: welcomeResult.data?.id },
      day3: { 
        scheduled: true, 
        sendAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        subject: bundle.day3Subject 
      },
      day7: { 
        scheduled: true, 
        sendAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subject: bundle.day7Subject 
      }
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sequence initiated",
        schedule: emailSchedule,
        orderId 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in bundle-purchase-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
