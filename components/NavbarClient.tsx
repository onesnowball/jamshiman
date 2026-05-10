'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GraduationCap, Calendar, MessageSquare, Search, BookOpen, Plus, UserCircle, Shield, Mail, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef, useEffect } from 'react'

type SchoolOption = { name: string; slug: string }

export function NavbarClient({
  isAdmin = false,
  school,
  schools = [],
}: {
  isAdmin?: boolean
  school?: string
  schools?: SchoolOption[]
}) {
  const path = usePathname()
  const router = useRouter()
  const s = school ?? ''
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navItems = s ? [
    { href: `/${s}/boards`,   label: 'Boards',   icon: MessageSquare },
    { href: '/messages',      label: 'Messages', icon: Mail },
    { href: `/${s}/advisors`, label: 'Advisors', icon: Search },
    { href: `/${s}/courses`,  label: 'Courses',  icon: BookOpen },
    { href: `/${s}/schedule`, label: 'Schedule', icon: Calendar },
  ] : [
    { href: '/messages', label: 'Messages', icon: Mail },
    { href: '/profile',  label: 'Profile',  icon: UserCircle },
  ]

  const homeHref = s ? `/${s}/boards` : '/'
  const currentSchool = schools.find(sc => sc.slug === s)

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-13 gap-4" style={{ height: '52px' }}>

        {/* Logo + campus switcher */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={homeHref} className="flex items-center gap-1.5 font-semibold text-gray-900">
            <GraduationCap className="text-brand-600" style={{ width: '18px', height: '18px' }} />
            <span className="text-sm">jamshiman</span>
          </Link>

          {isAdmin && schools.length > 1 && (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(o => !o)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
              >
                {currentSchool?.name.replace('University of ', '').replace(' University', '') ?? s}
                <ChevronDown className="w-3 h-3" />
              </button>

              {switcherOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {schools.map(sc => (
                    <button
                      key={sc.slug}
                      onClick={() => {
                        setSwitcherOpen(false)
                        router.push(`/${sc.slug}/boards`)
                      }}
                      className={clsx(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        sc.slug === s
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {sc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav items */}
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

        {/* Right icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
                path.startsWith('/admin')
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
              title="Admin"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/profile"
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
              path.startsWith('/profile')
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            )}
            title="Account"
          >
            <UserCircle className="w-4 h-4" />
          </Link>
          {s && (
            <Link
              href={`/${s}/boards/new`}
              className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
