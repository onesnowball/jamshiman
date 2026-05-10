'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, Search, Calendar, MessageSquare, User, Shield } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/advisors',  label: 'Advisors',  icon: Search },
  { href: '/courses',   label: 'Courses',   icon: GraduationCap },
  { href: '/boards',    label: 'Boards',    icon: MessageSquare },
  { href: '/schedule',  label: 'Schedule',  icon: Calendar },
]

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname()

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          <span>jamshiman</span>
          <span className="badge-blue text-[10px]">UMich launch</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                path.startsWith(href)
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ml-1',
                path.startsWith('/admin')
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              )}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <Link
            href="/profile"
            className="ml-2 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center"
          >
            <User className="w-4 h-4 text-brand-600" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
