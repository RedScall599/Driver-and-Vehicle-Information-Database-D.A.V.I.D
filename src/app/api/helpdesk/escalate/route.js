import { NextResponse } from 'next/server'
import { runEscalation } from '@/lib/escalation'

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

  const result = await runEscalation()
  return NextResponse.json(result)
}
