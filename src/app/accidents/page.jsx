'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import AccidentForm from './AccidentForm'
import TicketForm from './TicketForm'

const TABS = ['Data Input', 'Accidents', 'Tickets / Violations']

export default function AccidentsPage() {
  const [tab, setTab] = useState(0)
  const [accidentId, setAccidentId] = useState(null)   // null = list, 'new' = new form, number = edit
  const [ticketId, setTicketId] = useState(null)       // null = list, 'new' = new form, number = edit

  function handleTabChange(i) {
    setTab(i)
    // Reset to list view when switching tabs
    if (i === 1) setAccidentId(null)
    if (i === 2) setTicketId(null)
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Accident &amp; Violation Data</h1>
          <p className="text-gray-500 text-sm mt-0.5">Record accidents, police reports, insurance info, and traffic violations.</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map((label, i) => (
            <button
              key={label}
              onClick={() => handleTabChange(i)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === i
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 0 && <DataInputTab onNavigate={handleTabChange} />}
        {tab === 1 && (
          accidentId === null
            ? <AccidentListView onSelect={setAccidentId} onNew={() => setAccidentId('new')} />
            : <AccidentForm recordId={accidentId === 'new' ? null : accidentId} onBack={(id) => { if (id) setAccidentId(id); else setAccidentId(null) }} />
        )}
        {tab === 2 && (
          ticketId === null
            ? <TicketListView onSelect={setTicketId} onNew={() => setTicketId('new')} />
            : <TicketForm recordId={ticketId === 'new' ? null : ticketId} onBack={(id) => { if (id) setTicketId(id); else setTicketId(null) }} />
        )}
      </div>
    </AppShell>
  )
}

/* ── Accidents list view ─────────────────────────────────────── */
function AccidentListView({ onSelect, onNew }) {
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(q = '') {
    setLoading(true)
    const res = await fetch(`/api/accidents?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setRecords(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleSearch(e) { e.preventDefault(); load(search) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Accident Records</h2>
          <button onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors">
            + New Accident
          </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input type="text" placeholder="Search by driver name, VIN, or claim #…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
        <button type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); load('') }}
            className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No accident records found.{' '}<button onClick={onNew} className="text-red-700 hover:underline">Add the first one.</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Driver</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Accident Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">VIN #</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Claim #</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {[r.driverLastName, r.driverFirstName].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {r.accidentDate ? new Date(r.accidentDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600 font-mono">{r.vinNumber || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{r.claimNumber || '—'}</td>
                  <td className="px-5 py-3 text-right">
                      <button onClick={() => onSelect(r.id)}
                        className="text-red-700 hover:underline font-medium text-xs">
                        View / Edit →
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ── Tickets / Violations list view ─────────────────────────── */
function TicketListView({ onSelect, onNew }) {
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(q = '') {
    setLoading(true)
    const res = await fetch(`/api/tickets?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setRecords(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleSearch(e) { e.preventDefault(); load(search) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Traffic Violations</h2>
        <button onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors">
            + New Violation
          </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input type="text" placeholder="Search by driver name, citation #, or VIN…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
        <button type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); load('') }}
            className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No violation records found.{' '}<button onClick={onNew} className="text-red-700 hover:underline">Add the first one.</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Driver</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Violation Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Citation #</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {[r.driverLastName, r.driverFirstName].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {r.violationDate ? new Date(r.violationDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600 font-mono">{r.citationNumber || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{r.citationType || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{r.citationAmount || '—'}</td>
                  <td className="px-5 py-3 text-right">
                      <button onClick={() => onSelect(r.id)}
                        className="text-red-700 hover:underline font-medium text-xs">
                        View / Edit →
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function DataInputTab({ onNavigate }) {
  const [license, setLicense] = useState('')
  const [state, setState] = useState('')
  const [driver, setDriver] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [searching, setSearching] = useState(false)

  async function lookup(e) {
    e.preventDefault()
    if (!license.trim()) return
    setSearching(true)
    setNotFound(false)
    setDriver(null)
    const res = await fetch(`/api/drivers?search=${encodeURIComponent(license.trim())}`)
    const data = await res.json()
    const match = data.find(
      d => d.licenseNumber.toLowerCase() === license.trim().toLowerCase()
    )
    if (match) {
      setDriver(match)
    } else {
      setNotFound(true)
    }
    setSearching(false)
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Driver Lookup
        </h2>
        <form onSubmit={lookup} className="grid grid-cols-4 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Driver License Number
            </label>
            <input
              type="text"
              value={license}
              onChange={e => setLicense(e.target.value)}
              placeholder="Enter license number…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              State
            </label>
            <input
              type="text"
              maxLength={2}
              value={state}
              onChange={e => setState(e.target.value.toUpperCase())}
              placeholder="PA"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors"
          >
            {searching ? 'Looking up…' : 'Look Up Driver'}
          </button>
        </form>

        {notFound && (
          <p className="mt-3 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
            ⚠ No driver found with license number "{license}". Please verify and try again.
          </p>
        )}
      </section>

      {driver && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Driver Found</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Full Name</p>
              <p className="text-gray-900 font-medium">{driver.firstName} {driver.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Program</p>
              <p className="text-gray-900">{driver.program || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">License Status</p>
              <p className="text-gray-900">{driver.licenseStatus || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Driver Status</p>
              <p className="text-gray-900">{driver.driverStatus || '—'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onNavigate(1)}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              Record an Accident →
            </button>
            <button
              onClick={() => onNavigate(2)}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Record a Ticket / Violation →
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
