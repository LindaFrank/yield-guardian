import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'
type LogStatus = 'bounced' | 'complained' | 'suppressed'

const LOG_MESSAGES: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

// Notification-only bookkeeping: Lovable enforces suppression at send time.
async function recordOutcome(
  event: { event_id: string; data: Record<string, unknown> },
  reason: Reason,
  logStatus: LogStatus
): Promise<void> {
  const recipient = String(event.data.recipient ?? '')
  if (!recipient) {
    console.error('Email event missing recipient', { event_id: event.event_id })
    return
  }

  const normalizedEmail = recipient.toLowerCase()
  const messageId =
    typeof event.data.message_id === 'string' ? event.data.message_id : null

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email: normalizedEmail, reason, metadata: null }, { onConflict: 'email' })

  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: event.event_id,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('Failed to record suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'system',
    recipient_email: normalizedEmail,
    status: logStatus,
    error_message: LOG_MESSAGES[reason],
    metadata: null,
  })

  if (logError) {
    console.error('Failed to insert email_send_log row', {
      event_id: event.event_id,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('Failed to record email event')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await recordOutcome(event as never, 'bounce', 'bounced')
    },
    'email.complaint': async (event) => {
      await recordOutcome(event as never, 'complaint', 'complained')
    },
    'email.unsubscribed': async (event) => {
      await recordOutcome(event as never, 'unsubscribe', 'suppressed')
    },
  },
})

Deno.serve((req) => handler(req))
