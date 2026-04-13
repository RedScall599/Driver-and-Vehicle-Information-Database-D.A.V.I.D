import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEscalationEmail } from '@/lib/mailer'

/**
 * GET /api/helpdesk/escalate
 *
 * Finds all unacknowledged tickets older than HELPDESK_ESCALATE_MINUTES and
 * sends escalation emails to the secondary contact (HELPDESK_SECONDARY).
 *
 * Secure with HELPDESK_CRON_SECRET — pass it as:
 *   Header:        x-cron-secret: <secret>
 *   OR query param: ?secret=<secret>
 *
 * EC2 cron example (runs every 5 minutes):
 *   * /5 * * * * curl -s -H "x-cron-secret: YOUR_SECRET" https://your-domain.com/api/helpdesk/escalate
 *
 * Vercel Cron (vercel.json):
 *   { "crons": [{ "path": "/api/helpdesk/escalate", "schedule": "* /5 * * * *" }] }
 *   (use Authorization header in that case and check process.env.CRON_SECRET)
 */
export async function GET(request) {
  // Vercel Cron auto-generates CRON_SECRET and sends it as: Authorization: Bearer <CRON_SECRET>
  // We also support HELPDESK_CRON_SECRET for manual/EC2 calls
  const vercelSecret  = process.env.CRON_SECRET
  const customSecret  = process.env.HELPDESK_CRON_SECRET
  const authHeader    = request.headers.get('authorization') || ''
  const provided      = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.nextUrl.searchParams.get('secret')

  const validSecrets = [vercelSecret, customSecret].filter(Boolean)
  if (!validSecrets.length || !validSecrets.includes(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const minutes = parseInt(process.env.HELPDESK_ESCALATE_MINUTES || '30', 10)
  const cutoff  = new Date(Date.now() - minutes * 60 * 1000)

  const pending = await prisma.helpdeskTicket.findMany({
    where: {
      submittedAt:    { lt: cutoff },
      acknowledgedAt: null,
      escalatedAt:    null,
    },
  })

  let escalated = 0
  for (const ticket of pending) {
    try {
      await sendEscalationEmail(ticket, minutes)
      await prisma.helpdeskTicket.update({
        where: { id: ticket.id },
        data:  { escalatedAt: new Date() },
      })
      escalated++
    } catch (err) {
      console.error(`[escalate] Failed for ticket ${ticket.id}:`, err)
    }
  }

  return NextResponse.json({ checked: pending.length, escalated })
}
