import nodemailer from 'nodemailer'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file.'
    )
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

/**
 * Send a new help desk ticket to the primary contact.
 */
export async function sendHelpdeskEmail({ replyTo, subject, html, text }) {
  const transport = createTransport()
  const fromName = process.env.HELPDESK_FROM_NAME || 'D.A.V.I.D. Help Desk'
  const primary  = process.env.HELPDESK_PRIMARY

  if (!primary) {
    throw new Error('No primary recipient configured. Set HELPDESK_PRIMARY in your .env file.')
  }

  await transport.sendMail({
    from:    `"${fromName}" <${process.env.SMTP_USER}>`,
    replyTo: replyTo || undefined,
    to:      primary,
    subject,
    text,
    html,
  })
}

/**
 * Send an escalation email to the secondary contact.
 * @param {object} ticket  HelpdeskTicket record from the DB
 * @param {number} minutes How many minutes passed without acknowledgment
 */
export async function sendEscalationEmail(ticket, minutes) {
  const transport = createTransport()
  const fromName  = process.env.HELPDESK_FROM_NAME || 'D.A.V.I.D. Help Desk'
  const secondary = process.env.HELPDESK_SECONDARY

  if (!secondary) {
    throw new Error('No secondary recipient configured. Set HELPDESK_SECONDARY in your .env file.')
  }

  const pLabel    = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'URGENT' }[ticket.priority] ?? 'Normal'
  const submitted = new Date(ticket.submittedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })
  const safe      = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#b45309;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">⚠️ Escalated Help Desk Request</h2>
    <p style="color:#fde68a;margin:4px 0 0;font-size:13px">Not acknowledged within ${minutes} minutes — escalated to you</p>
  </div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e">
      The primary contact did not acknowledge this request within <strong>${minutes} minutes</strong>. This ticket has been escalated to you for follow-up.
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">From</td><td style="padding:6px 0">${safe(ticket.name)} &lt;${safe(ticket.email)}&gt;</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Category</td><td style="padding:6px 0">${safe(ticket.category) || 'General Inquiry'}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Priority</td><td style="padding:6px 0">${pLabel}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Submitted</td><td style="padding:6px 0">${submitted} ET</td></tr>
    </table>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px">
      <p style="margin:0 0 8px;font-weight:600;font-size:14px">${safe(ticket.subject)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#374151">${safe(ticket.message)}</p>
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
      Reply directly to ${safe(ticket.email)} to respond to ${safe(ticket.name)}.
    </p>
  </div>
</div>`

  const text = `ESCALATED — D.A.V.I.D. Help Desk Request\n\nThis request was not acknowledged within ${minutes} minutes.\n\nFrom: ${ticket.name} <${ticket.email}>\nCategory: ${ticket.category || 'General Inquiry'}\nPriority: ${pLabel}\nSubmitted: ${submitted} ET\n\n${ticket.subject}\n${'\u2500'.repeat(60)}\n${ticket.message}`

  await transport.sendMail({
    from:    `"${fromName}" <${process.env.SMTP_USER}>`,
    replyTo: ticket.email || undefined,
    to:      secondary,
    subject: `[ESCALATED] [D.A.V.I.D. Help Desk] ${ticket.subject}`,
    text,
    html,
  })
}
