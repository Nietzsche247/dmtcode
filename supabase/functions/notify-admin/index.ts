import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type?: 'first_non_red' | 'null_report' | 'new_symbol_submission';
  symbolId?: string;
  wavelength?: string;
  surface?: string;
  metadata?: Record<string, any>;
  submission?: {
    id: string;
    user_id: string;
    image_url: string;
    description?: string;
    tags?: string[];
    source_method?: string;
  };
  // Moderation notification fields
  submissionId?: string;
  action?: 'approved' | 'rejected';
  reason?: string;
}

const escapeHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: NotificationRequest = await req.json();
    const { type, symbolId, wavelength, surface, metadata, submission, submissionId, action, reason } = body;

    // Handle moderation status change notification to submitter
    if (submissionId && action) {
      console.log(`[Moderation] Symbol ${submissionId} was ${action}`);

      // Get submission and user details
      const { data: submissionData } = await supabase
        .from('symbol_submissions')
        .select('user_id, description')
        .eq('id', submissionId)
        .single();

      if (!submissionData) {
        console.log('Submission not found, skipping notification');
        return new Response(
          JSON.stringify({ success: true, message: 'Submission not found' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Get user email from auth.users (requires service role)
      const { data: userData } = await supabase.auth.admin.getUserById(submissionData.user_id);
      const userEmail = userData?.user?.email;

      if (!userEmail) {
        console.log('User email not found, skipping email notification');
        return new Response(
          JSON.stringify({ success: true, message: 'User email not found' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        try {
          const isApproved = action === 'approved';
          const subject = isApproved 
            ? '✅ Your symbol submission was approved!' 
            : '❌ Your symbol submission was not approved';
          
          const html = isApproved 
            ? `
              <h2>Great news!</h2>
              <p>Your symbol submission to the DMT Code registry has been approved and is now visible to the community.</p>
              <p><strong>Description:</strong> ${submissionData.description || 'No description provided'}</p>
              <p><a href="https://dmtcode.com/registry">View the Registry</a></p>
              <p>Thank you for contributing to psychedelic research!</p>
            `
            : `
              <h2>Submission Update</h2>
              <p>Unfortunately, your symbol submission to the DMT Code registry was not approved.</p>
              <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
              <p><strong>Your description:</strong> ${submissionData.description || 'No description provided'}</p>
              <p>You can submit a new symbol that meets our guidelines.</p>
              <p><a href="https://dmtcode.com/submit-symbol">Submit Another Symbol</a></p>
            `;

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'DMT Code <notifications@dmtcode.com>',
              to: [userEmail],
              subject,
              html,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Moderation email send failed:', await emailResponse.text());
          } else {
            console.log(`Moderation notification email sent to ${userEmail}`);
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Moderation notification processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Handle new symbol submission notification
    if (submission) {
      console.log(`[Admin Alert] NEW_SYMBOL_SUBMISSION - Symbol: ${submission.id}`);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', submission.user_id)
        .single();

      const userName = profile?.display_name || 'Anonymous User';
      const message = `📝 NEW SYMBOL SUBMISSION\n\nUser: ${userName}\nSource: ${submission.source_method || 'Not specified'}\nTags: ${submission.tags?.join(', ') || 'None'}\nDescription: ${submission.description?.substring(0, 100) || 'None'}\n\nView: https://dmtcode.com/admin`;

      // Store notification
      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'new_symbol_submission',
          symbol_id: submission.id,
          message,
          metadata: {
            user_id: submission.user_id,
            source_method: submission.source_method,
            tags: submission.tags,
            description: submission.description?.substring(0, 100),
          },
        });

      if (notifError) {
        console.error('Failed to store notification:', notifError);
      }

      // Send email if Resend is configured
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'DMT Code <notifications@dmtcode.com>',
              to: ['admin@dmtcode.com'],
              subject: `New Symbol Submission from ${userName}`,
              html: `
                <h2>New Symbol Submission</h2>
                <p><strong>User:</strong> ${userName}</p>
                <p><strong>Source Method:</strong> ${submission.source_method || 'Not specified'}</p>
                <p><strong>Tags:</strong> ${submission.tags?.join(', ') || 'None'}</p>
                <p><strong>Description:</strong> ${submission.description || 'None provided'}</p>
                <p><a href="${submission.image_url}">View Symbol Image</a></p>
                <p><a href="https://dmtcode.com/admin">Review in Admin Dashboard</a></p>
              `,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Email send failed:', await emailResponse.text());
          } else {
            console.log('Admin notification email sent successfully');
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'New submission notification sent' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Handle legacy notification types
    console.log(`[Admin Alert] ${type?.toUpperCase()} - Symbol: ${symbolId}`);

    let message = '';
    
    if (type === 'first_non_red') {
      message = `🚨 FIRST NON-RED WAVELENGTH SUBMISSION!\n\nSymbol ID: DLC-2025-${symbolId}\nWavelength: ${wavelength}\nTimestamp: ${new Date().toISOString()}\n\nView at: https://dmtcode.com/registry`;
    } else if (type === 'null_report') {
      message = `⚪ NULL REPORT SUBMITTED\n\nSymbol ID: DLC-2025-${symbolId}\nWavelength: ${wavelength}\nSurface: ${surface}\nTimestamp: ${new Date().toISOString()}\n\nView null dashboard: https://dmtcode.com/admin`;
    }

    console.log(message);

    const { error: notifError } = await supabase
      .from('admin_notifications')
      .insert({
        type,
        symbol_id: symbolId,
        message,
        metadata: { wavelength, surface, ...metadata },
      });

    if (notifError) {
      console.error('Failed to store notification:', notifError);
    }

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
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in notify-admin function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
