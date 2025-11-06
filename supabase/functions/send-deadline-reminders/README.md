# Send Deadline Reminders Edge Function

This Supabase Edge Function sends email reminders to users 2 days before their application deadlines.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy send-deadline-reminders
   ```

2. **Set environment variables:**
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin access)
   - Email service credentials (if using Resend, SendGrid, etc.)

3. **Schedule the function:**
   
   You can schedule this function to run daily using one of these methods:

   **Option A: Using pg_cron (PostgreSQL extension)**
   ```sql
   -- Enable pg_cron extension
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   -- Schedule the function to run daily at 9 AM
   SELECT cron.schedule(
     'send-deadline-reminders',
     '0 9 * * *', -- Cron expression: 9 AM daily
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deadline-reminders',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer YOUR_ANON_KEY'
       )
     ) AS request_id;
     $$
   );
   ```

   **Option B: Using Supabase Cron (if available)**
   - Go to Supabase Dashboard → Database → Cron Jobs
   - Create a new cron job that calls this function daily

   **Option C: External cron service**
   - Use a service like cron-job.org or GitHub Actions to call the function daily

## Email Integration

Currently, the function logs email reminders. To actually send emails, integrate with an email service:

### Using Resend
```typescript
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: userEmail,
  subject: `Reminder: Application Deadline in 2 Days - ${schoolName}`,
  html: emailHtml,
})
```

### Using SendGrid
```typescript
import { sendEmail } from 'https://esm.sh/@sendgrid/mail@7.7.0'

sendEmail.setApiKey(Deno.env.get('SENDGRID_API_KEY'))

await sendEmail.send({
  to: userEmail,
  from: 'noreply@yourdomain.com',
  subject: `Reminder: Application Deadline in 2 Days - ${schoolName}`,
  html: emailHtml,
})
```

## Database Requirements

The function expects:
- A `profiles` table with `id` and `email` columns (or use `auth.users.email` directly)
- The `applications` table with `deadline`, `school_id`, and `owner_id` columns
- The `schools` table with `name` column

If you don't have a `profiles` table, modify the function to fetch emails directly from `auth.users`.

