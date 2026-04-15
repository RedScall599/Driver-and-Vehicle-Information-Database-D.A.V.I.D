import { prisma } from '@/lib/prisma'
import { sendEscalationEmail } from '@/lib/mailer'

/**
 * Core escalation logic — shared between the API route and the background timer.
 * Finds unacknowledged tickets older than HELPDESK_ESCALATE_MINUTES and emails
 * the secondary contact.
 * @returns {{ checked: number, escalated: number }}
 */
export async function runEscalation() {
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
      console.log(`[escalation] Escalated ticket #${ticket.id} (${ticket.subject})`)
    } catch (err) {
      console.error(`[escalation] Failed for ticket #${ticket.id}:`, err.message)
    }
  }

  return { checked: pending.length, escalated }
}
