'use client'

import { useEffect, useState } from 'react'

const EMPTY = {
  driverLicenseNumber: '', driverFirstName: '', driverLastName: '',
  programPartnerName: '', vinNumber: '',
  violationDate: '', citationNumber: '', citationDate: '',
  citationType: '', citationAmount: '',
}

export default function TicketForm({ recordId, onBack }) {
  const isNew = !recordId
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (isNew) { setForm(EMPTY); setLoading(false); return }
    setLoading(true)
    fetch(`/api/tickets/${recordId}`)
      .then(r => r.json())
      .then(data => {
        const fmt = v => v ? v.split('T')[0] : ''
        setForm({
          ...data,
          violationDate: fmt(data.violationDate),
          citationDate: fmt(data.citationDate),
        })
        setLoading(false)
      })
  }, [recordId, isNew])

  function validate() {
    const errs = {}
    if (!form.driverLastName?.trim()) errs.driverLastName = 'Driver last name is required'
    if (!form.citationNumber?.trim()) errs.citationNumber = 'Citation number is required'
    return errs
  }

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    setSaved(false)
  }

  async function save(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/tickets' : `/api/tickets/${recordId}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      if (isNew) onBack(data.id)
    } catch (err) {
      setError(err.message || 'Could not save record.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this violation record? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tickets/${recordId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onBack()
    } catch {
      setError('Could not delete record.')
      setDeleting(false)
    }
  }

  const Field = ({ label, name, type = 'text', className = '', required = false }) => (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={form[name] || ''} onChange={change}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
          fieldErrors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`} />
      {fieldErrors[name] && <p className="text-xs text-red-600 mt-1">{fieldErrors[name]}</p>}
    </div>
  )

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading&hellip;</div>

  return (
    <div className="space-y-5">
      {/* Back + Delete bar */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onBack()}
          className="text-xs text-gray-500 hover:text-red-700 font-medium">
          ← Back to Violations
        </button>
        {!isNew && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40">
            {deleting ? 'Deleting…' : 'Delete Record'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-start gap-2">
          <span>⚠</span><span>{error}</span>
        </div>
      )}
      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
          <span>✓</span> Record saved successfully.
        </div>
      )}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm">
          Please fill in all required fields marked with <span className="text-red-500 font-bold">*</span>
        </div>
      )}

      <form onSubmit={save} noValidate className="space-y-5">
        {/* Driver info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Driver Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Driver First Name" name="driverFirstName" />
            <Field label="Driver Last Name" name="driverLastName" required />
          </div>
          <Field label="Driver License Number" name="driverLicenseNumber" />
        </section>

        {/* Program & Vehicle */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Program &amp; Vehicle Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Program Partner Name" name="programPartnerName" className="col-span-2" />
            <Field label="VIN #" name="vinNumber" className="col-span-2" />
          </div>
        </section>

        {/* Violation Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Violation Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Violation Date" name="violationDate" type="date" />
            <Field label="Citation #" name="citationNumber" required />
            <Field label="Citation Date" name="citationDate" type="date" />
            <Field label="Citation Type" name="citationType" />
            <Field label="Citation Amount" name="citationAmount" />
          </div>
        </section>

        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : isNew ? 'Create Violation Record' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
