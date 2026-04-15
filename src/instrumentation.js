/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and production).
 * Sets up a background interval to check for unacknowledged help desk tickets
 * and send escalation emails — no external cron service needed.
 */
export async function register() {
  // Only run in the Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { runEscalation } = await import('@/lib/escalation')

  const intervalMs = 60 * 1000 // check every 60 seconds

  console.log('[escalation] Background timer started — checking every 60 seconds')

  setInterval(async () => {
    try {
      const { checked, escalated } = await runEscalation()
      if (checked > 0 || escalated > 0) {
        console.log(`[escalation] Checked: ${checked} ticket(s), Escalated: ${escalated}`)
      }
    } catch (err) {
      console.error('[escalation] Background check error:', err.message)
    }
  }, intervalMs)
}
