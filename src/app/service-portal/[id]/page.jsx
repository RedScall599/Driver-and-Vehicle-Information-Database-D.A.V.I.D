'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import FileAttachments from '@/components/FileAttachments'

const ISSUE_OPTIONS = ['Vehicle', 'Staff', 'Facility', 'Equipment', 'Other']
const TYPE_OPTIONS = [
  'Vehicle Accident', 'Traffic Ticket / Violation', 'Vehicle Maintenance',
  'Damage Report', 'Insurance Claim', 'Other',
]

export default function ServiceRequestPage() {
  const router = useRouter()
  const params = useParams()

  const [form, setForm] = useState({
    ticketId: '', dateOfReport: '', issueWith: '',
    requestType: '', other: '', incidentLocation: '',
    details: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState('')
  const [allIds, setAllIds] = useState([])
  const originalForm = useRef(null)

  useEffect(() => {
    fetch('/api/service-requests')
      .then(r => r.json())
      .then(data => setAllIds(data.map(d => d.id)))
  }, [])

  useEffect(() => {
    fetch(`/api/service-requests/${params.id}`)
      .then(r => r.json())
      .then(data => {
        const fmt = v => v ? v.split('T')[0] : ''
        const formatted = { ...data, dateOfReport: fmt(data.dateOfReport) }
        setForm(formatted)
        originalForm.current = formatted
        setLoading(false)
      })
  }, [params.id])

  function validate() {
    const errs = {}
    if (!form.issueWith) errs.issueWith = 'Please select what the issue is with'
    if (!form.requestType) errs.requestType = 'Please select a request type'
    return errs
  }

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    setSaved('')
  }

  async function handleDelete() {
    if (!confirm('Delete this service request? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/service-requests/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/service-portal')
    } catch {
      setApiError('Could not delete this request.')
      setDeleting(false)
    }
  }

  async function save(type) {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (originalForm.current && JSON.stringify(form) === JSON.stringify(originalForm.current)) {
      setSaved('No changes were made.')
      return
    }
    setSaving(true)
    setApiError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/service-requests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved('Request saved successfully.')
      if (type === 'accident') {
        router.push('/accidents')
      }
    } catch (err) {
      setApiError(err.message || 'Could not save request.')
    } finally {
      setSaving(false)
    }
  }

  function navigate(dir) {
    const currentIdx = allIds.indexOf(Number(params.id))
    const next = allIds[currentIdx + dir]
    if (next) router.push(`/service-portal/${next}`)
  }

  if (loading) {
    return <AppShell><div className="flex items-center justify-center h-64 text-gray-400">Loading…</div></AppShell>
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/service-portal" className="text-xs text-gray-500 hover:text-red-700">
              ← Back to Service Portal
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Service Request</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} disabled={allIds.indexOf(Number(params.id)) === 0}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <button onClick={() => navigate(1)} disabled={allIds.indexOf(Number(params.id)) === allIds.length - 1}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        </div>

        {/* Ticket ID badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            Ticket / Service Request ID
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-mono font-bold text-sm">
            {form.ticketId}
          </span>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-start gap-2">
            <span>⚠</span><span>{apiError}</span>
          </div>
        )}
        {saved && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
            <span>✓</span> {saved}
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm">
            Please fill in all required fields marked with <span className="text-red-500 font-bold">*</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Date of Report */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Date of Report
            </label>
            <input type="date" name="dateOfReport" value={form.dateOfReport || ''} onChange={change}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
          </div>

          {/* Issue With */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Issue With<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select name="issueWith" value={form.issueWith || ''} onChange={change}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                errors.issueWith ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}>
              <option value="">— Select —</option>
              {ISSUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.issueWith && <p className="text-xs text-red-600 mt-1">{errors.issueWith}</p>}
          </div>

          {/* Request Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Request Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select name="requestType" value={form.requestType || ''} onChange={change}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                errors.requestType ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}>
              <option value="">— Select —</option>
              {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.requestType && <p className="text-xs text-red-600 mt-1">{errors.requestType}</p>}
          </div>

          {/* Other */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              * Other
            </label>
            <textarea name="other" value={form.other || ''} onChange={change} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none" />
          </div>

          {/* Incident Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Incident Location (if needed)
            </label>
            <input type="text" name="incidentLocation" value={form.incidentLocation || ''} onChange={change}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Details
            </label>
            <textarea name="details" value={form.details || ''} onChange={change} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none" />
          </div>
        </div>

        <FileAttachments recordType="serviceRequest" recordId={Number(params.id)} />

        {/* Submit buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => save('accident')} disabled={saving || deleting}
              className="flex-1 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors text-center">
              {saving ? 'Saving…' : 'Submit an Accident or Ticket'}
            </button>
            <button onClick={() => save('other')} disabled={saving || deleting}
              className="flex-1 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors text-center">
              {saving ? 'Saving…' : 'Submit All Other Requests'}
            </button>
          </div>
        <div className="mt-3 flex justify-end">
            <button type="button" onClick={handleDelete} disabled={saving || deleting}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-40">
              {deleting ? 'Deleting…' : 'Delete Request'}
            </button>
          </div>
      </div>
    </AppShell>
  )
}
