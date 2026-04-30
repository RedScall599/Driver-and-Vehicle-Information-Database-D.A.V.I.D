import Link from 'next/link'
import AppShell from '@/components/AppShell'

const sections = [
  {
    href: '/drivers',
    title: 'Drivers',
    description: 'Add, edit, and manage driver records including license, status, and suspension info.',
    icon: '👤',
    color: 'bg-cyan-50 border-cyan-200',
    iconBg: 'bg-cyan-600',
  },
  {
    href: '/vehicles',
    title: 'Vehicles',
    description: 'Manage program vehicles — VIN, plate, GPS tracker, IMEI, and driver assignments.',
    icon: '🚗',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-600',
  },
  {
    href: '/accidents',
    title: 'Accidents & Violations',
    description: 'Record and search vehicle accidents, tickets, and citation details.',
    icon: '⚠️',
    color: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-600',
  },
  {
    href: '/service-portal',
    title: 'Service Portal',
    description: 'Submit and track service requests, incidents, and vehicle issues.',
    icon: '🎫',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-600',
  },
  {
    href: '/help-desk',
    title: 'Help Desk',
    description: 'Send a help request for issues related to the website or questions.',
    icon: '🎧',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-600',
  },
]

export default function Home() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome to the D.A.V.I.D. system. Select a module to get started.
          </p>
        </div>

        {/* Brand banner */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm mb-8 flex items-center justify-center px-6 py-3">
          <img
            src="/uac-logo.png"
            alt="Urban Affairs Coalition"
            className="w-auto object-contain"
            style={{ height: '100px' }}
          />
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
          {sections.map(({ href, title, description, icon, color, iconBg }) => (
            <Link
              key={title}
              href={href}
              className={`group rounded-xl border p-5 ${color} hover:shadow-md transition-shadow flex flex-col gap-3 w-full`}
            >
              <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center text-white text-lg shrink-0`}>
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
