'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { useUser } from '@/components/AuthProvider'

const CATEGORIES = [
  'Technical Issue',
  'Data / Records Error',
  'Account Access',
  'Driver Record Question',
  'Vehicle Record Question',
  'Accident / Ticket Record',
  'Service Portal Question',
  'General Inquiry',
  'Other',
]

const PRIORITIES = [
  { value: 'low',    label: 'Low',    desc: 'No urgency, general questions', color: 'text-green-700' },
  { value: 'normal', label: 'Normal', desc: 'Standard request',              color: 'text-blue-700'  },
  { value: 'high',   label: 'High',   desc: 'Needs attention soon',          color: 'text-orange-700'},
  { value: 'urgent', label: 'Urgent', desc: 'Blocking / critical issue',     color: 'text-red-700'   },
]

const EMPTY = {
  category: 'General Inquiry',
  priority: 'normal',
  name: '',
  email: '',
  subject: '',
  message: '',
}

export default function HelpDeskPage() {
  const user = useUser()

  const [form, setForm] = useState({
    ...EMPTY,
    name:  user?.name  || '',
    email: user?.email || '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting]   = useState(false)
  const [apiError,   setApiError]     = useState('')
  const [submitted,  setSubmitted]    = useState(false)

  // Prefill name/email once user loads (it starts undefined)
  const [prefilled, setPrefilled] = useState(false)
  if (user && !prefilled) {
    setPrefilled(true)
    setForm(f => ({
      ...f,
      name:  f.name  || user.name  || '',
      email: f.email || user.email || '',
    }))
  }

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    setApiError('')
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())    errs.name    = 'Your name is required.'
    if (!form.email.trim())   errs.email   = 'Your email is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (!form.subject.trim()) errs.subject = 'Subject is required.'
    if (!form.message.trim()) errs.message = 'Please describe your issue or question.'
    return errs
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSubmitting(true)
    setApiError('')
    try {
      const res  = await fetch('/api/helpdesk', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed.')
      setSubmitted(true)
    } catch (err) {
      setApiError(err.message || 'Could not send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setForm({ ...EMPTY, name: user?.name || '', email: user?.email || '' })
    setFieldErrors({})
    setApiError('')
    setSubmitted(false)
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Help Desk</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Submit a support request and our team will follow up by email.
          </p>
        </div>

        {submitted ? (
          /* ── Success state ──────────────────────────────── */
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h2 className="text-lg font-semibold text-green-800">Request Sent!</h2>
            <p className="text-sm text-green-700 max-w-sm mx-auto">
              Your help request has been emailed to the support team. Someone will reply to{' '}
              <strong>{form.email}</strong> shortly.
            </p>
            <button onClick={reset}
              className="mt-4 inline-block px-5 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 transition-colors">
              Submit Another Request
            </button>
          </div>
        ) : (
          /* ── Form ───────────────────────────────────────── */
          <form onSubmit={submit} noValidate className="space-y-5">
            {apiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-start gap-2">
                <span>⚠</span><span>{apiError}</span>
              </div>
            )}

            {/* Contact info */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Your Contact Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" name="name" required
                  form={form} fieldErrors={fieldErrors} onChange={change} />
                <Field label="Email Address" name="email" type="email" required
                  form={form} fieldErrors={fieldErrors} onChange={change} />
              </div>
            </section>

            {/* Request details */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Request Details</h2>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Category
                </label>
                <select name="category" value={form.category} onChange={change}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRIORITIES.map(({ value, label, desc, color }) => (
                    <label key={value}
                      className={`relative flex flex-col gap-0.5 cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        form.priority === value
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="priority" value={value} checked={form.priority === value}
                        onChange={change} className="sr-only" />
                      <span className={`font-semibold ${color}`}>{label}</span>
                      <span className="text-xs text-gray-500 leading-tight">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <Field label="Subject" name="subject" required placeholder="Brief description of your issue"
                form={form} fieldErrors={fieldErrors} onChange={change} />

              {/* Message */}
              <Field label="Message" name="message" required textarea
                placeholder="Describe your issue in detail. Include any relevant record IDs, driver names, or error messages."
                form={form} fieldErrors={fieldErrors} onChange={change} />
            </section>

            <div className="flex justify-end pb-6">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors">
                {submitting ? 'Sending…' : 'Send Help Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}

/* ── Reusable Field component ─────────────────────────────────── */
function Field({ label, name, type = 'text', required = false, textarea = false, placeholder = '', form, fieldErrors, onChange }) {
  return (
    <div className={textarea ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea name={name} value={form[name] || ''} onChange={onChange} rows={5}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-colors ${
            fieldErrors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`} />
      ) : (
        <input type={type} name={name} value={form[name] || ''} onChange={onChange}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
            fieldErrors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`} />
      )}
      {fieldErrors[name] && <p className="text-xs text-red-600 mt-1">{fieldErrors[name]}</p>}
    </div>
  )
}
