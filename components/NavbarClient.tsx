'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GraduationCap, Calendar, MessageSquare, Search, BookOpen, Plus, UserCircle, Shield, Mail, ChevronDown, Layers, Moon } from 'lucide-react'
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
    { href: `/${s}/pulse`,       label: 'Pulse',       icon: Moon },
    { href: `/${s}/advisors`,    label: 'Advisors',    icon: Search },
    { href: `/${s}/departments`, label: 'Departments', icon: Layers },
    { href: `/${s}/courses`,     label: 'Courses',     icon: BookOpen },
    { href: `/${s}/boards`,      label: 'Boards',      icon: MessageSquare },
    { href: '/messages',         label: 'Messages',    icon: Mail },
    { href: `/${s}/schedule`,    label: 'Schedule',    icon: Calendar },
  ] : [
    { href: '/messages', label: 'Messages', icon: Mail },
    { href: '/profile',  label: 'Profile',  icon: UserCircle },
  ]

  const homeHref = s ? `/${s}` : '/'
  const currentSchool = schools.find(sc => sc.slug === s)
  const schoolAdminPrefix = s ? `/${s}/admin` : '/admin'
  const isAdminPath = path.startsWith('/admin') || (s ? path.startsWith(schoolAdminPrefix) : false)

  function shortName(name: string) {
    return name.replace('University of ', '').replace(' University', '')
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100/80 shadow-[0_1px_0_0_rgb(0,0,0,0.04)]">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-4" style={{ height: '52px' }}>

        {/* Logo + campus switcher */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={homeHref} className="flex items-center gap-1.5 font-semibold text-gray-900 hover:text-brand-700 transition-colors">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap className="text-white" style={{ width: '14px', height: '14px' }} />
            </div>
            <span className="text-sm tracking-tight">jamshiman</span>
          </Link>

          {isAdmin && schools.length > 1 && (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(o => !o)}
                className={clsx(
                  'flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg text-xs font-medium transition-all',
                  switcherOpen
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-brand-700 bg-brand-50 hover:bg-brand-100'
                )}
              >
                {currentSchool ? shortName(currentSchool.name) : s}
                <ChevronDown className={clsx('w-3 h-3 transition-transform duration-150', switcherOpen && 'rotate-180')} />
              </button>

              {switcherOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl overflow-hidden z-50" style={{ boxShadow: 'var(--shadow-popover)' }}>
                  <div className="px-3 pt-2.5 pb-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Switch campus</p>
                  </div>
                  {schools.map(sc => (
                    <button
                      key={sc.slug}
                      onClick={() => {
                        setSwitcherOpen(false)
                        if (isAdminPath) {
                          const adminRest = s && path.startsWith(schoolAdminPrefix)
                            ? path.slice(schoolAdminPrefix.length)
                            : ''
                          router.push(`/${sc.slug}/admin${adminRest}`)
                        } else {
                          router.push(`/${sc.slug}/boards`)
                        }
                      }}
                      className={clsx(
                        'w-full text-left px-3 py-2.5 text-sm transition-colors',
                        sc.slug === s
                          ? 'bg-brand-50 text-brand-700 font-semibold'
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
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', active && 'text-brand-600')} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdmin && (
            <Link
              href={s ? `/${s}/admin` : '/admin'}
              prefetch={false}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-all',
                isAdminPath
                  ? 'bg-red-50 text-red-700 font-semibold'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              )}
              title="Admin"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/profile"
            prefetch={false}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-all',
              path.startsWith('/profile')
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            )}
            title="Account"
          >
            <UserCircle className="w-4 h-4" />
          </Link>
          {s && (
            <Link
              href={`/${s}/boards/new`}
              prefetch={false}
              className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-all shadow-[0_1px_2px_0_rgb(15,61,212,0.25)] hover:shadow-[0_2px_6px_0_rgb(15,61,212,0.3)]"
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
