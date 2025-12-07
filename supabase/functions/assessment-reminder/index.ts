import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get users who have completed at least one assessment but not in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all users with assessments
    const { data: usersWithAssessments, error: usersError } = await supabase
      .from("assessments")
      .select("user_id")
      .not("user_id", "is", null);

    if (usersError) {
      console.error("Error fetching users with assessments:", usersError);
      throw usersError;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(usersWithAssessments?.map(a => a.user_id) || [])];
    
    if (uniqueUserIds.length === 0) {
      console.log("No users with assessments found");
      return new Response(JSON.stringify({ message: "No users to remind", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const userId of uniqueUserIds) {
      // Check if user has completed an assessment in the last 7 days
      const { data: recentAssessment, error: recentError } = await supabase
        .from("assessments")
        .select("id, created_at")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .limit(1);

      if (recentError) {
        console.error(`Error checking recent assessment for user ${userId}:`, recentError);
        continue;
      }

      // Skip if user has a recent assessment
      if (recentAssessment && recentAssessment.length > 0) {
        console.log(`User ${userId} has recent assessment, skipping`);
        continue;
      }

      // Get user email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError || !userData?.user?.email) {
        console.error(`Error fetching user email for ${userId}:`, userError);
        continue;
      }

      const userEmail = userData.user.email;

      // Get user's last assessment date
      const { data: lastAssessment } = await supabase
        .from("assessments")
        .select("created_at, phq9_score, gad7_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const lastDate = lastAssessment?.created_at 
        ? new Date(lastAssessment.created_at).toLocaleDateString("en-US", { 
            month: "long", 
            day: "numeric", 
            year: "numeric" 
          })
        : "your last session";

      // Send reminder email
      try {
        const { error: emailError } = await resend.emails.send({
          from: "DMT Code Project <onboarding@resend.dev>",
          to: [userEmail],
          subject: "Weekly Assessment Reminder - Track Your Progress",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; padding: 40px 20px; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #333;">
                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">Weekly Check-In Reminder</h1>
                
                <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
                  It's been a week since your last assessment on <strong style="color: #e5e5e5;">${lastDate}</strong>. 
                  Regular tracking helps identify patterns and measure progress over time.
                </p>

                ${lastAssessment && (lastAssessment.phq9_score !== null || lastAssessment.gad7_score !== null) ? `
                <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #ffffff; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Last Assessment Scores</h3>
                  <div style="display: flex; gap: 20px;">
                    ${lastAssessment.phq9_score !== null ? `
                    <div>
                      <span style="color: #a3a3a3; font-size: 12px;">PHQ-9</span>
                      <div style="color: #ffffff; font-size: 24px; font-weight: bold;">${lastAssessment.phq9_score}</div>
                    </div>
                    ` : ''}
                    ${lastAssessment.gad7_score !== null ? `
                    <div>
                      <span style="color: #a3a3a3; font-size: 12px;">GAD-7</span>
                      <div style="color: #ffffff; font-size: 24px; font-weight: bold;">${lastAssessment.gad7_score}</div>
                    </div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}

                <a href="https://dmtcode.com/assess" style="display: inline-block; background-color: #C41E3A; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0;">
                  Complete This Week's Assessment
                </a>

                <p style="color: #737373; font-size: 12px; line-height: 1.5; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #333;">
                  You're receiving this because you've completed assessments on DMT Code Project. 
                  Regular weekly check-ins help track your progress over time.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error(`Error sending email to ${userEmail}:`, emailError);
          errors.push(`Failed to send to ${userEmail}: ${emailError.message}`);
        } else {
          console.log(`Reminder sent to ${userEmail}`);
          emailsSent++;
        }
      } catch (sendError: unknown) {
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        console.error(`Exception sending email to ${userEmail}:`, sendError);
        errors.push(`Exception for ${userEmail}: ${errorMessage}`);
      }
    }

    console.log(`Assessment reminders complete: ${emailsSent} sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        message: "Assessment reminders processed",
        sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in assessment-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
