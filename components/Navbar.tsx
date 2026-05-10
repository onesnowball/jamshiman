'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, Calendar, MessageSquare, Search, BookOpen, Plus } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/boards',   label: 'Boards',   icon: MessageSquare },
  { href: '/advisors', label: 'Advisors', icon: Search },
  { href: '/courses',  label: 'Courses',  icon: BookOpen },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
]

export function Navbar({ isAdmin = false, showNewPost = false }: { isAdmin?: boolean; showNewPost?: boolean }) {
  const path = usePathname()

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-13 gap-4" style={{ height: '52px' }}>
        <Link href="/boards" className="flex items-center gap-1.5 font-semibold text-gray-900 flex-shrink-0">
          <GraduationCap className="w-4.5 h-4.5 text-brand-600" style={{ width: '18px', height: '18px' }} />
          <span className="text-sm">jamshiman</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                path.startsWith(href)
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/boards/new"
          className="flex-shrink-0 flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Post</span>
        </Link>
      </div>
    </nav>
  )
}
