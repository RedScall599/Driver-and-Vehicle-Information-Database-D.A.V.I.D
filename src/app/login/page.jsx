'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const timedOut = searchParams.get('reason') === 'timeout'
  const [tab, setTab] = useState('signin')   // 'signin' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function change(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (tab === 'signup') {
      if (!form.name.trim()) return setError('Full name is required.')
      if (!form.email.trim()) return setError('Email is required.')
      if (form.password.length < 8) return setError('Password must be at least 8 characters.')
      if (form.password !== form.confirm) return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const url = tab === 'signin' ? '/api/auth/login' : '/api/auth/signup'
      const body = tab === 'signin'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
            Urban Affairs Coalition
          </p>
          <h1 className="text-3xl font-bold text-white">D.A.V.I.D.</h1>
          <p className="text-gray-400 text-sm mt-1">Driver &amp; Vehicle Information Database</p>
        </div>

        {timedOut && (
          <div className="mb-4 rounded-xl border border-amber-400 bg-amber-950/60 text-amber-300 px-4 py-3 text-sm text-center">
            ⏰ You were signed out due to inactivity. Please sign in again.
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex">
            <button
              onClick={() => { setTab('signin'); setError('') }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === 'signin'
                  ? 'bg-white text-gray-900 border-b-2 border-red-700'
                  : 'bg-gray-50 text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError('') }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === 'signup'
                  ? 'bg-white text-gray-900 border-b-2 border-red-700'
                  : 'bg-gray-50 text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} className="p-8 space-y-4" noValidate>
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={change}
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                placeholder={tab === 'signup' ? 'At least 8 characters' : '••••••••'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={change}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors mt-2"
            >
              {loading
                ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
                : (tab === 'signin' ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Authorized personnel only — Urban Affairs Coalition
        </p>
      </div>
    </div>
  )
}
