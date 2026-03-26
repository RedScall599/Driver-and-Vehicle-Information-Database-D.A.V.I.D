'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/drivers', label: 'Drivers', icon: '👤' },
  { href: '/vehicles', label: 'Vehicles', icon: '🚗' },
  { href: '/accidents', label: 'Accidents & Violations', icon: '⚠️' },
  { href: '/service-portal', label: 'Service Portal', icon: '🎫' },
]

export default function AppShell({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col shrink-0">
        {/* Logo / Brand */}
        <div className="px-6 py-5 border-b border-gray-700">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Urban Affairs Coalition
          </p>
          <h1 className="text-white font-bold text-lg leading-tight">
            D.A.V.I.D.
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Driver &amp; Vehicle Info DB
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-red-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">© 2026 Urban Affairs Coalition</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">
              D.A.V.I.D.
            </h2>
            <p className="text-xs text-gray-500">
              Driver and Vehicle Information Database
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
