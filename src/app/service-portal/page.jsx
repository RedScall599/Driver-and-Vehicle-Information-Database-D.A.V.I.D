'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'

export default function ServicePortalPage() {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/service-requests')
      .then(r => r.json())
      .then(data => { setRequests(data); setLoading(false) })
  }, [])

  async function newRequest() {
    setCreating(true)
    const res = await fetch('/api/service-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    router.push(`/service-portal/${data.id}`)
  }

  function typeBadge(type) {
    if (!type) return 'bg-gray-100 text-gray-600'
    if (type.toLowerCase().includes('accident')) return 'bg-orange-100 text-orange-700'
    if (type.toLowerCase().includes('ticket') || type.toLowerCase().includes('violation'))
      return 'bg-red-100 text-red-700'
    return 'bg-blue-100 text-blue-700'
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Portal</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Submit and track service requests, vehicle incidents, and issues.
            </p>
          </div>
          <button
            onClick={newRequest}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors"
          >
            {creating ? 'Creating…' : '+ New Service Request'}
          </button>
        </div>

        {/* Welcome banner (shown when no requests) */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">🎫</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to the UAC Service Portal
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              How can we help you today? Submit a new service request to get started.
            </p>
            <button
              onClick={newRequest}
              disabled={creating}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {creating ? 'Creating…' : 'New Service Request'}
            </button>
          </div>
        )}

        {/* Requests table */}
        {!loading && requests.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Ticket ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Date of Report</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Issue With</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Request Type</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono font-medium text-gray-900">{r.ticketId}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.dateOfReport ? new Date(r.dateOfReport).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.issueWith || '—'}</td>
                    <td className="px-5 py-3">
                      {r.requestType ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(r.requestType)}`}>
                          {r.requestType}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/service-portal/${r.id}`}
                        className="text-red-700 hover:underline font-medium text-xs">
                        View / Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        )}
      </div>
    </AppShell>
  )
}
