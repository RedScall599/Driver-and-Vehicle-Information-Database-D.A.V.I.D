'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import FileAttachments from '@/components/FileAttachments'

const EMPTY = {
  programVehicle: '', year: '', make: '', model: '',
  vinNumber: '', licensePlateNumber: '', gpsTracker: '',
  imeiNumber: '', serialNumber: '', existingDamages: '', driverId: '',
}

function Field({ label, name, type = 'text', className = '', required = false, form, errors, onChange, inputFilter }) {
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
      <input type={type} name={name} value={form[name] || ''}
        inputMode={inputFilter === 'numeric' || inputFilter === 'decimal' ? 'numeric' : undefined}
        onChange={handleChange}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
          errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`} />
      {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name]}</p>}
    </div>
  )
}

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === 'new'

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const [drivers, setDrivers] = useState([])
  const [allIds, setAllIds] = useState([])
  const attachRef = useRef()

  useEffect(() => {
    fetch('/api/drivers').then(r => r.json()).then(setDrivers)
    fetch('/api/vehicles').then(r => r.json()).then(data => setAllIds(data.map(v => v.id)))
  }, [])

  useEffect(() => {
    if (isNew) return
    fetch(`/api/vehicles/${params.id}`)
      .then(r => r.json())
      .then(data => { setForm(data); setLoading(false) })
  }, [params.id, isNew])

  function validate() {
    const errs = {}
    if (!form.programVehicle?.trim()) errs.programVehicle = 'Program vehicle is required'
    if (!form.year?.trim()) errs.year = 'Year is required'
    if (!form.make?.trim()) errs.make = 'Make is required'
    if (!form.model?.trim()) errs.model = 'Model is required'
    if (!form.vinNumber?.trim()) errs.vinNumber = 'VIN number is required'
    if (!form.licensePlateNumber?.trim()) errs.licensePlateNumber = 'License plate is required'
    if (!form.gpsTracker?.trim()) errs.gpsTracker = 'GPS tracker is required'
    if (!form.imeiNumber?.trim()) errs.imeiNumber = 'IMEI number is required'
    if (!form.serialNumber?.trim()) errs.serialNumber = 'Serial number is required'
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
      const payload = { ...form, driverId: form.driverId ? Number(form.driverId) : null }
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/vehicles' : `/api/vehicles/${params.id}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      if (isNew) {
        await attachRef.current?.flush(data.id)
        router.push(`/vehicles/${data.id}`)
      }
    } catch (err) {
      setApiError(err.message || 'Could not save. Please check required fields.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this vehicle record? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/vehicles/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/vehicles')
    } catch {
      setApiError('Could not delete this record.')
    }
  }

  function navigate(dir) {
    const idx = allIds.indexOf(Number(params.id))
    const next = allIds[idx + dir]
    if (next) router.push(`/vehicles/${next}`)
  }

  if (loading) {
    return <AppShell><div className="flex items-center justify-center h-64 text-gray-400">Loading…</div></AppShell>
  }

  const fp = { form, errors, onChange: change }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/vehicles" className="text-xs text-gray-500 hover:text-red-700">← Back to Vehicles</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {isNew ? 'New Vehicle' : ([form.year, form.make, form.model].filter(Boolean).join(' ') || 'Vehicle')}
            </h1>
          </div>
          {!isNew && (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} disabled={allIds.indexOf(Number(params.id)) === 0}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              <button onClick={() => navigate(1)} disabled={allIds.indexOf(Number(params.id)) === allIds.length - 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
              <Link href="/vehicles/new"
                  className="px-3 py-1.5 text-xs font-medium bg-red-700 text-white rounded-lg hover:bg-red-800">
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
          {/* Vehicle Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-3 gap-4">
              <Field {...fp} label="Program Vehicle" name="programVehicle" required className="col-span-3" />
              <Field {...fp} label="Year" name="year" required inputFilter="numeric" />
              <Field {...fp} label="Make" name="make" required inputFilter="alpha" />
              <Field {...fp} label="Model" name="model" required />
              <Field {...fp} label="VIN Number" name="vinNumber" required className="col-span-2" />
              <Field {...fp} label="License Plate" name="licensePlateNumber" required />
            </div>
          </section>

          {/* Tracking Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Tracking & Identifiers</h2>
            <div className="grid grid-cols-3 gap-4">
              <Field {...fp} label="GPS Tracker" name="gpsTracker" required />
              <Field {...fp} label="IMEI Number" name="imeiNumber" required inputFilter="numeric" />
              <Field {...fp} label="Serial Number" name="serialNumber" required />
            </div>
          </section>

          {/* Existing Damages */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Existing Damages</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Damage Description</label>
              <textarea
                name="existingDamages"
                value={form.existingDamages || ''}
                onChange={change}
                rows={4}
                placeholder="Describe any pre-existing damage to the vehicle…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-y"
              />
            </div>
          </section>

          {/* Driver Assignment */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Driver Assignment</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Assigned Driver
              </label>
              <select name="driverId" value={form.driverId || ''} onChange={change}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white">
                <option value="">— Unassigned —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.lastName}, {d.firstName} — {d.licenseNumber}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <FileAttachments ref={attachRef} recordType="vehicle" recordId={isNew ? null : Number(params.id)} />

          <div className="flex items-center justify-between">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : isNew ? 'Create Vehicle' : 'Save Changes'}
              </button>
              {!isNew && (
                <button type="button" onClick={remove}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium">
                  Delete Record
                </button>
              )}
            </div>
        </form>
      </div>
    </AppShell>
  )
}
