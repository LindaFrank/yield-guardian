import { createClient } from 'npm:@supabase/supabase-js@2'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEMPLATE_NAME = 'contact-confirmation'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let submissionId: string
  try {
    const body = await req.json()
    submissionId = String(body.submissionId ?? body.submission_id ?? '')
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400)
  }

  if (!UUID_RE.test(submissionId)) {
    return jsonResponse({ error: 'A valid submissionId is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Recipient is derived from trusted data — the stored contact submission.
  const { data: submission, error: lookupError } = await supabase
    .from('contact_messages')
    .select('id, name, email, message')
    .eq('id', submissionId)
    .maybeSingle()

  if (lookupError) {
    console.error('Failed to look up contact submission', { error: lookupError })
    return jsonResponse({ error: 'Failed to load submission' }, 500)
  }

  if (!submission?.email) {
    return jsonResponse({ error: 'Submission not found' }, 404)
  }

  const recipient = submission.email as string

  try {
    const result = await sendTemplateEmail(TEMPLATE_NAME, recipient, {
      templateData: { name: submission.name, message: submission.message },
      idempotencyKey: `contact-confirm-${submission.id}`,
    })

    if (!result.sent) {
      const { error: logError } = await supabase.from('email_send_log').insert({
        template_name: TEMPLATE_NAME,
        recipient_email: recipient,
        status: 'suppressed',
      })
      if (logError) console.error('Failed to log suppressed send', { error: logError })

      return jsonResponse({ success: false, reason: 'recipient_suppressed' })
    }

    const { error: logError } = await supabase.from('email_send_log').insert({
      template_name: TEMPLATE_NAME,
      recipient_email: recipient,
      status: 'sent',
    })
    if (logError) console.error('Failed to log sent email', { error: logError })

    return jsonResponse({ success: true })
  } catch (error) {
    const message =
      error instanceof EmailAPIError
        ? `${error.code}: ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error)

    console.error('Contact confirmation send failed', { message })

    const { error: logError } = await supabase.from('email_send_log').insert({
      template_name: TEMPLATE_NAME,
      recipient_email: recipient,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    if (logError) console.error('Failed to log failed send', { error: logError })

    return jsonResponse({ error: 'Failed to send confirmation email' }, 500)
  }
})
