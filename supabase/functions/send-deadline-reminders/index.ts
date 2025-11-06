// Supabase Edge Function to send email reminders 2 days before application deadlines
// This function should be scheduled to run daily (e.g., using pg_cron or Supabase Cron)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate date 2 days from now
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    const targetDateStr = twoDaysFromNow.toISOString().split('T')[0]

    // Fetch applications with deadlines in 2 days
    const { data: applications, error: appsError } = await supabaseClient
      .from('applications')
      .select(
        `
        id,
        deadline,
        school_id,
        owner_id,
        schools!inner(name),
        profiles!inner(email)
      `
      )
      .eq('deadline', targetDateStr)
      .not('owner_id', 'is', null)

    if (appsError) {
      throw appsError
    }

    if (!applications || applications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No deadlines found for 2 days from now', count: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fetch user emails (if you have a profiles table)
    const userIds = [...new Set(applications.map((app) => app.owner_id).filter(Boolean))]
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      // Continue without email lookup - you can use auth.users.email directly if available
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) || [])

    // Send email reminders (you'll need to integrate with your email service)
    // Example using Resend, SendGrid, or similar
    const emailResults = []

    for (const app of applications) {
      const userEmail = profileMap.get(app.owner_id) || null
      const schoolName = app.schools?.name || 'Unknown School'

      if (!userEmail) {
        console.warn(`No email found for user ${app.owner_id}`)
        continue
      }

      // Here you would integrate with your email service
      // Example structure:
      try {
        // const emailResult = await sendEmail({
        //   to: userEmail,
        //   subject: `Reminder: Application Deadline in 2 Days - ${schoolName}`,
        //   html: `
        //     <h2>Application Deadline Reminder</h2>
        //     <p>Hello,</p>
        //     <p>This is a reminder that your application deadline for <strong>${schoolName}</strong> is in 2 days (${app.deadline}).</p>
        //     <p>Make sure to submit your application on time!</p>
        //     <p>Best of luck,<br>The DPT Tracker Team</p>
        //   `,
        // })
        // emailResults.push({ success: true, email: userEmail, applicationId: app.id })

        // For now, just log it
        console.log(`Would send email to ${userEmail} for ${schoolName} deadline on ${app.deadline}`)
        emailResults.push({ success: true, email: userEmail, applicationId: app.id })
      } catch (emailError) {
        console.error(`Failed to send email to ${userEmail}:`, emailError)
        emailResults.push({ success: false, email: userEmail, applicationId: app.id, error: emailError })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Deadline reminders processed',
        count: applications.length,
        emailsSent: emailResults.filter((r) => r.success).length,
        emailsFailed: emailResults.filter((r) => !r.success).length,
        results: emailResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-deadline-reminders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

