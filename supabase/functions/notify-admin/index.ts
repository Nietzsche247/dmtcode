import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'first_non_red' | 'null_report';
  symbolId: string;
  wavelength?: string;
  surface?: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, symbolId, wavelength, surface, metadata }: NotificationRequest = await req.json();

    console.log(`[Admin Alert] ${type.toUpperCase()} - Symbol: ${symbolId}`);

    let message = '';
    
    if (type === 'first_non_red') {
      message = `🚨 FIRST NON-RED WAVELENGTH SUBMISSION!\n\nSymbol ID: DLC-2025-${symbolId}\nWavelength: ${wavelength}\nTimestamp: ${new Date().toISOString()}\n\nView at: https://dmtcode.com/registry`;
    } else if (type === 'null_report') {
      message = `⚪ NULL REPORT SUBMITTED\n\nSymbol ID: DLC-2025-${symbolId}\nWavelength: ${wavelength}\nSurface: ${surface}\nTimestamp: ${new Date().toISOString()}\n\nView null dashboard: https://dmtcode.com/admin`;
    }

    // Log to console (viewable in edge function logs)
    console.log(message);

    // Store in a notifications table (optional - could create this table)
    const { error: notifError } = await supabase
      .from('admin_notifications')
      .insert({
        type,
        symbol_id: symbolId,
        message,
        metadata: { wavelength, surface, ...metadata },
        created_at: new Date().toISOString()
      });

    if (notifError) {
      console.error('Failed to store notification:', notifError);
      // Don't fail the request if notification storage fails
    }

    // TODO: Add email/Slack integration here if RESEND_API_KEY or SLACK_WEBHOOK_URL is configured
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && type === 'first_non_red') {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'DMT Code Alerts <alerts@dmtcode.com>',
            to: ['admin@dmtcode.com'],
            subject: '🚨 First Non-Red Wavelength Submission!',
            text: message,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in notify-admin function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
