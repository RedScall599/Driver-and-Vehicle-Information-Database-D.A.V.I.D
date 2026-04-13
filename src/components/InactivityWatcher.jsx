'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/AuthProvider'

const ADMIN_TIMEOUT  = 30 * 60 * 1000  // 30 minutes
const USER_TIMEOUT   = 10 * 60 * 1000  // 10 minutes
const WARNING_BEFORE = 60 * 1000       // show warning 1 minute before logout

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

export default function InactivityWatcher() {
  const user   = useUser()
  const router = useRouter()
  const timerRef   = useRef(null)
  const warnRef    = useRef(null)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Don't start until user is resolved, and skip on login page
    if (user === undefined) return
    if (!user) return

    const timeout = user.role === 'admin' ? ADMIN_TIMEOUT : USER_TIMEOUT

    function reset() {
      setShowWarning(false)
      clearTimeout(timerRef.current)
      clearTimeout(warnRef.current)

      // Show 1-minute warning before the logout fires
      warnRef.current = setTimeout(() => setShowWarning(true), timeout - WARNING_BEFORE)

      // Force logout when timeout is reached
      timerRef.current = setTimeout(async () => {
        setShowWarning(false)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login?reason=timeout')
        router.refresh()
      }, timeout)
    }

    // Kick off timers immediately
    reset()

    // Reset on any user activity
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(warnRef.current)
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset))
    }
  }, [user, router])

  if (!showWarning) return null

  const minutes = user?.role === 'admin' ? 30 : 10

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl shadow-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
      <p className="font-semibold mb-1">⏰ Session expiring soon</p>
      <p>
        You've been inactive for {minutes - 1} minutes. You'll be logged out in 1 minute.
        Move your mouse or press any key to stay signed in.
      </p>
    </div>
  )
}
