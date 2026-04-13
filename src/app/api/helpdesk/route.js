import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendHelpdeskEmail } from '@/lib/mailer'
import { getSession } from '@/lib/auth'

const PRIORITY_LABELS = {
  low:    'Low',
  normal: 'Normal',
  high:   'High',
  urgent: 'URGENT',
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { category, priority, name, email, subject, message } = body

    // Basic validation
    if (!name?.trim())    return NextResponse.json({ error: 'Name is required.'    }, { status: 422 })
    if (!email?.trim())   return NextResponse.json({ error: 'Email is required.'   }, { status: 422 })
    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required.' }, { status: 422 })
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required.' }, { status: 422 })

    const session = await getSession()
    const role    = session?.role ?? 'user'
    const pLabel  = PRIORITY_LABELS[priority] ?? 'Normal'
    const now     = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

    // Save ticket to DB so we can track acknowledgment + trigger escalation
    const ticket = await prisma.helpdeskTicket.create({
      data: {
        category: category || null,
        priority: priority || null,
        name, email, subject, message, role,
      },
    })

    const appUrl   = (process.env.APP_URL || '').replace(/\/$/, '')
    const ackUrl   = `${appUrl}/api/helpdesk/acknowledge?token=${ticket.token}`
    const minutes  = parseInt(process.env.HELPDESK_ESCALATE_MINUTES || '30', 10)
    const emailSubject = `[D.A.V.I.D. Help Desk] [${pLabel}] ${subject}`
    const safe = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#7f1d1d;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">D.A.V.I.D. Help Desk Request</h2>
    <p style="color:#fca5a5;margin:4px 0 0;font-size:13px">Driver &amp; Vehicle Information Database — Urban Affairs Coalition</p>
  </div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">From</td><td style="padding:6px 0">${safe(name)} &lt;${safe(email)}&gt;</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Account Role</td><td style="padding:6px 0;text-transform:capitalize">${role}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Category</td><td style="padding:6px 0">${safe(category) || 'General Inquiry'}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Priority</td>
          <td style="padding:6px 0"><span style="background:${priorityBg(priority)};color:${priorityFg(priority)};padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">${pLabel}</span></td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;font-weight:600">Submitted</td><td style="padding:6px 0">${now} ET</td></tr>
    </table>

    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px">
      <p style="margin:0 0 8px;font-weight:600;font-size:14px">${safe(subject)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#374151">${safe(message)}</p>
    </div>

    <div style="margin-top:24px;text-align:center">
      <a href="${ackUrl}" style="display:inline-block;padding:10px 28px;background:#7f1d1d;color:#fff;font-weight:600;font-size:14px;border-radius:6px;text-decoration:none">
        ✓ Acknowledge Ticket
      </a>
      <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">
        Please acknowledge within ${minutes} minutes. If no response, this ticket will be escalated automatically.
      </p>
    </div>

    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
      Reply directly to this email to respond to ${safe(name)}. This request was submitted via the D.A.V.I.D. internal portal.
    </p>
  </div>
</div>`

    const text = `D.A.V.I.D. Help Desk Request\n\nFrom: ${name} <${email}>\nRole: ${role}\nCategory: ${category || 'General Inquiry'}\nPriority: ${pLabel}\nSubmitted: ${now} ET\n\n${subject}\n${'\u2500'.repeat(60)}\n${message}\n\n${'\u2500'.repeat(60)}\nACKNOWLEDGE this ticket within ${minutes} minutes:\n${ackUrl}\n\nIf not acknowledged, this request will be escalated automatically.`

    await sendHelpdeskEmail({ replyTo: email, subject: emailSubject, html, text })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/helpdesk]', err)
    const isConfig = err.message?.includes('not configured') || err.message?.includes('No primary')
    return NextResponse.json(
      { error: isConfig ? err.message : 'Failed to send your request. Please try again.' },
      { status: isConfig ? 503 : 500 }
    )
  }
}

function priorityBg(p) {
  return { low: '#f0fdf4', normal: '#eff6ff', high: '#fff7ed', urgent: '#fef2f2' }[p] ?? '#eff6ff'
}
function priorityFg(p) {
  return { low: '#166534', normal: '#1d4ed8', high: '#c2410c', urgent: '#991b1b' }[p] ?? '#1d4ed8'
}
