'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchVehicles(q = '') {
    setLoading(true)
    const res = await fetch(`/api/vehicles?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setVehicles(data)
    setLoading(false)
  }

  useEffect(() => { fetchVehicles() }, [])

  function handleSearch(e) {
    e.preventDefault()
    fetchVehicles(search)
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage program vehicles and assignments.</p>
          </div>
          <Link
            href="/vehicles/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors"
          >
            + New Vehicle
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by program, VIN, plate, or make…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchVehicles('') }}
              className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              Clear
            </button>
          )}
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
          ) : vehicles.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No vehicles found.{' '}
              <Link href="/vehicles/new" className="text-red-700 hover:underline">Add the first one.</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Program Vehicle</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Year / Make / Model</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">VIN</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Plate</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Assigned Driver</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{v.programVehicle || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{v.vinNumber || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{v.licensePlateNumber || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {v.driver ? `${v.driver.lastName}, ${v.driver.firstName}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/vehicles/${v.id}`} className="text-red-700 hover:underline font-medium text-xs">
                          View / Edit →
                        </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
