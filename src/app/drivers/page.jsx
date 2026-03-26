'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'

export default function DriversPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchDrivers(q = '') {
    setLoading(true)
    const res = await fetch(`/api/drivers?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setDrivers(data)
    setLoading(false)
  }

  useEffect(() => { fetchDrivers() }, [])

  function handleSearch(e) {
    e.preventDefault()
    fetchDrivers(search)
  }

  function statusBadge(status) {
    const map = {
      Active: 'bg-green-100 text-green-800',
      Suspended: 'bg-red-100 text-red-800',
      Expired: 'bg-yellow-100 text-yellow-800',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage driver records and license information.
            </p>
          </div>
          <Link
            href="/drivers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors"
          >
            + New Driver
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by name or license number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchDrivers('') }}
              className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
          ) : drivers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No drivers found.{' '}
              <Link href="/drivers/new" className="text-red-700 hover:underline">
                Add the first one.
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Full Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Program</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">License #</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">State</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">License Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {d.lastName}, {d.firstName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{d.program || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 font-mono">{d.licenseNumber}</td>
                    <td className="px-5 py-3 text-gray-600">{d.licenseState || '—'}</td>
                    <td className="px-5 py-3">
                      {d.licenseStatus ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(d.licenseStatus)}`}>
                          {d.licenseStatus}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/drivers/${d.id}`}
                        className="text-red-700 hover:underline font-medium text-xs"
                      >
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
