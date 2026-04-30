'use client'

import { useEffect, useState, useRef } from 'react'
import FileAttachments from '@/components/FileAttachments'

const EMPTY = {
  driverLicenseNumber: '', driverFirstName: '', driverLastName: '',
  programPartnerName: '', accidentDate: '', vinNumber: '',
  year: '', make: '', model: '', licensePlate: '',
  dcNumber: '', policeReportDate: '', policeReportTime: '',
  dateReportedToInsurance: '', staffMemberReporting: '',
  claimNumber: '', adjusterAssigned: '', documentation: '',
}

function Field({ label, name, type = 'text', className = '', textarea = false, required = false, form, fieldErrors, onChange, inputFilter }) {
  function handleChange(e) {
    if (inputFilter === 'alpha') e.target.value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '')
    else if (inputFilter === 'numeric') e.target.value = e.target.value.replace(/[^0-9]/g, '')
    else if (inputFilter === 'decimal') e.target.value = e.target.value.replace(/[^0-9.]/g, '')
    onChange(e)
  }
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea name={name} value={form[name] || ''} onChange={onChange} rows={3}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none transition-colors ${
            fieldErrors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`} />
      ) : (
        <input type={type} name={name} value={form[name] || ''}
          inputMode={inputFilter === 'numeric' || inputFilter === 'decimal' ? 'numeric' : undefined}
          onChange={handleChange}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
            fieldErrors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`} />
      )}
      {fieldErrors[name] && <p className="text-xs text-red-600 mt-1">{fieldErrors[name]}</p>}
    </div>
  )
}

export default function AccidentForm({ recordId, onBack }) {
  const isNew = !recordId
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const originalForm = useRef(null)

  useEffect(() => {
    if (isNew) { setForm(EMPTY); setLoading(false); return }
    setLoading(true)
    fetch(`/api/accidents/${recordId}`)
      .then(r => r.json())
      .then(data => {
        const fmt = v => v ? v.split('T')[0] : ''
        const formatted = {
          ...data,
          accidentDate: fmt(data.accidentDate),
          policeReportDate: fmt(data.policeReportDate),
          dateReportedToInsurance: fmt(data.dateReportedToInsurance),
        }
        setForm(formatted)
        originalForm.current = formatted
        setLoading(false)
      })
  }, [recordId, isNew])

  function validate() {
    const errs = {}
    if (!form.driverLastName?.trim()) errs.driverLastName = 'Driver last name is required'
    if (!form.accidentDate) errs.accidentDate = 'Accident date is required'
    return errs
  }

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    setSaved('')
  }

  async function save(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    if (!isNew && originalForm.current && JSON.stringify(form) === JSON.stringify(originalForm.current)) {
      setSaved('No changes were made.')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/accidents' : `/api/accidents/${recordId}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved('Record saved successfully.')
      if (isNew) onBack(data.id)
    } catch (err) {
      setError(err.message || 'Could not save record.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this accident record? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/accidents/${recordId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onBack()
    } catch {
      setError('Could not delete record.')
      setDeleting(false)
    }
  }

  const fp = { form, fieldErrors, onChange: change }

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading&hellip;</div>

  return (
    <div className="space-y-5">
      {/* Back + Delete bar */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onBack()}
          className="text-xs text-gray-500 hover:text-red-700 font-medium">
          ← Back to Accidents
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
          <span>✓</span> {saved}
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
            <Field {...fp} label="Driver First Name" name="driverFirstName" inputFilter="alpha" />
            <Field {...fp} label="Driver Last Name" name="driverLastName" required inputFilter="alpha" />
          </div>
          <Field {...fp} label="Driver License Number" name="driverLicenseNumber" />
        </section>

        {/* Program & Vehicle */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Program &amp; Vehicle Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field {...fp} label="Program Partner Name" name="programPartnerName" className="col-span-2" />
            <Field {...fp} label="Accident Date" name="accidentDate" type="date" required />
            <Field {...fp} label="VIN #" name="vinNumber" />
            <Field {...fp} label="Year" name="year" inputFilter="numeric" />
            <Field {...fp} label="Make" name="make" inputFilter="alpha" />
            <Field {...fp} label="Model" name="model" />
            <Field {...fp} label="License Plate" name="licensePlate" />
          </div>
        </section>

        {/* Police Report */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Police Report Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field {...fp} label="DC #" name="dcNumber" />
            <Field {...fp} label="Police Report Date" name="policeReportDate" type="date" />
            <Field {...fp} label="Police Report Time (if known)" name="policeReportTime" />
          </div>
        </section>

        {/* Insurance */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Insurance Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field {...fp} label="Date Reported to Ins. Agency" name="dateReportedToInsurance" type="date" />
            <Field {...fp} label="Staff Member Reporting to Ins. Company" name="staffMemberReporting" inputFilter="alpha" />
            <Field {...fp} label="Claim Number" name="claimNumber" />
            <Field {...fp} label="Adjuster Assigned" name="adjusterAssigned" inputFilter="alpha" />
            <Field {...fp} label="Documentation" name="documentation" textarea className="col-span-2" />
          </div>
        </section>

        <FileAttachments recordType="accident" recordId={recordId} />

        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : isNew ? 'Create Accident Record' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
