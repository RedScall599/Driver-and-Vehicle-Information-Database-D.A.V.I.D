'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'

const EMPTY = {
  firstName: '', lastName: '', program: '',
  licenseNumber: '', licenseState: '', licenseExpiration: '',
  driverStatus: '', suspensionStartDate: '', suspensionEndDate: '',
  licenseStatus: '',
}

export default function DriverDetailPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === 'new'

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const [allIds, setAllIds] = useState([])

  useEffect(() => {
    fetch('/api/drivers').then(r => r.json()).then(data => {
      setAllIds(data.map(d => d.id))
    })
  }, [])

  useEffect(() => {
    if (isNew) return
    fetch(`/api/drivers/${params.id}`)
      .then(r => r.json())
      .then(data => {
        // Format dates for input[type=date]
        const fmt = (v) => v ? v.split('T')[0] : ''
        setForm({
          ...data,
          licenseExpiration: fmt(data.licenseExpiration),
          suspensionStartDate: fmt(data.suspensionStartDate),
          suspensionEndDate: fmt(data.suspensionEndDate),
        })
        setLoading(false)
      })
  }, [params.id, isNew])

  function validate() {
    const errs = {}
    if (!form.firstName?.trim()) errs.firstName = 'First name is required'
    if (!form.lastName?.trim()) errs.lastName = 'Last name is required'
    if (!form.licenseNumber?.trim()) errs.licenseNumber = 'License number is required'
    return errs
  }

  function change(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    setSaved(false)
  }

  async function save(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    setApiError('')
    try {
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/drivers' : `/api/drivers/${params.id}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      if (isNew) router.push(`/drivers/${data.id}`)
    } catch (err) {
      setApiError(err.message || 'Could not save. Please check required fields.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this driver record? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/drivers/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/drivers')
    } catch {
      setApiError('Could not delete this record.')
    }
  }

  function navigate(dir) {
    const idx = allIds.indexOf(Number(params.id))
    const next = allIds[idx + dir]
    if (next) router.push(`/drivers/${next}`)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
      </AppShell>
    )
  }

  const Field = ({ label, name, type = 'text', className = '', required = false }) => (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name] || ''}
        onChange={change}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
          errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name]}</p>}
    </div>
  )

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/drivers" className="text-xs text-gray-500 hover:text-red-700">
              ← Back to Drivers
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {isNew ? 'New Driver' : `${form.lastName || ''}, ${form.firstName || ''}`}
            </h1>
          </div>
          {/* Record navigation */}
          {!isNew && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                disabled={allIds.indexOf(Number(params.id)) === 0}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                onClick={() => navigate(1)}
                disabled={allIds.indexOf(Number(params.id)) === allIds.length - 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
              <Link
                href="/drivers/new"
                className="px-3 py-1.5 text-xs font-medium bg-red-700 text-white rounded-lg hover:bg-red-800"
              >
                + New
              </Link>
            </div>
          )}
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-start gap-2">
            <span>⚠</span><span>{apiError}</span>
          </div>
        )}
        {saved && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
            <span>✓</span> Record saved successfully.
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm">
            Please fill in all required fields marked with <span className="text-red-500 font-bold">*</span>
          </div>
        )}

        <form onSubmit={save} noValidate className="space-y-6">
          {/* Personal Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Last Name" name="lastName" required />
              <Field label="First Name" name="firstName" required />
              <Field label="Program" name="program" className="col-span-2" />
            </div>
          </section>

          {/* License Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              License Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <Field label="License #" name="licenseNumber" required className="col-span-2" />
              <Field label="State" name="licenseState" />
              <Field label="Expiration Date" name="licenseExpiration" type="date" />
              <Field label="License Status" name="licenseStatus" />
              <Field label="Driver Status" name="driverStatus" />
            </div>
          </section>

          {/* Suspension Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Suspension Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Suspension Start Date" name="suspensionStartDate" type="date" />
              <Field label="Suspension End Date" name="suspensionEndDate" type="date" />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : isNew ? 'Create Driver' : 'Save Changes'}
              </button>
              <Link
                href="/vehicles/new"
                className="px-5 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                + Add Vehicle
              </Link>
            </div>
            {!isNew && (
              <button
                type="button"
                onClick={remove}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Delete Record
              </button>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  )
}
