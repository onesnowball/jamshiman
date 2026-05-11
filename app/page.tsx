'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Search, ArrowRight } from 'lucide-react'

const SCHOOLS = [
  { name: 'University of Michigan',  short: 'UMich',       emoji: '〽️',  href: '/auth/login?school=umich.edu',         live: true  },
  { name: 'Northwestern University', short: 'Northwestern', emoji: '🐾',  href: '/auth/login?school=northwestern.edu',  live: true  },
  { name: 'UIUC',                    short: 'UIUC',         emoji: '🌽',  href: '/auth/login?school=illinois.edu',      live: true  },
  { name: 'Stanford University',     short: 'Stanford',     emoji: '🌲',  href: null,          live: false },
  { name: 'Carnegie Mellon',         short: 'CMU',          emoji: '🎓',  href: null,          live: false },
  { name: 'UC Berkeley',             short: 'Berkeley',     emoji: '🐻',  href: null,          live: false },
  { name: 'Georgia Tech',            short: 'GT',           emoji: '🐝',  href: null,          live: false },
  { name: 'Purdue University',       short: 'Purdue',       emoji: '🚂',  href: null,          live: false },
  { name: 'Caltech',                 short: 'Caltech',      emoji: '🔭',  href: null,          live: false },
  { name: 'MIT',                     short: 'MIT',          emoji: '🦫',  href: null,          live: false },
  { name: 'Cornell University',      short: 'Cornell',      emoji: '🐻',  href: null,          live: false },
  { name: 'UT Austin',               short: 'UT Austin',    emoji: '🤘',  href: null,          live: false },
]

export default function Home() {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? SCHOOLS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.short.toLowerCase().includes(query.toLowerCase())
      )
    : SCHOOLS

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #13246a 60%, #0f3dd4 100%)' }}>

      {/* Header */}
      <header className="max-w-5xl mx-auto w-full px-6 h-14 flex items-center">
        <div className="flex items-center gap-2 font-semibold text-white">
          <GraduationCap className="w-5 h-5 text-brand-300" />
          <span>jamshiman</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <p className="text-brand-200 text-sm font-medium tracking-widest uppercase mb-4 opacity-80">
          Campus life, honestly
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold text-white text-center mb-4 tracking-tight leading-tight">
          Find your campus.
        </h1>
        <p className="text-blue-200 text-base sm:text-lg text-center mb-10 max-w-sm opacity-70 leading-relaxed">
          Advisor reviews, course ratings, and anonymous boards — verified by your .edu email.
        </p>

        {/* Search */}
        <div className="relative w-full max-w-sm mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 opacity-60 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your school…"
            className="w-full rounded-xl px-4 py-3 pl-10 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        {/* School grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-xl">
          {filtered.map(school =>
            school.live ? (
              <Link
                key={school.name}
                href={school.href!}
                className="group relative rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: 'rgba(63,114,255,0.25)', border: '1px solid rgba(63,114,255,0.5)' }}
              >
                <div className="text-3xl mb-2">{school.emoji}</div>
                <div className="text-sm font-bold text-white">{school.short}</div>
                <div className="text-[10px] text-brand-300 mt-0.5 font-medium">Live ✓</div>
                <ArrowRight className="absolute top-3 right-3 w-3 h-3 text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ) : (
              <div
                key={school.name}
                className="rounded-2xl p-4 text-center cursor-not-allowed select-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-3xl mb-2 opacity-40">{school.emoji}</div>
                <div className="text-sm font-semibold text-white opacity-30">{school.short}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Soon</div>
              </div>
            )
          )}
        </div>

        {query.trim() && filtered.length === 0 && (
          <p className="text-blue-300 opacity-60 mt-6 text-sm">
            Not here yet — but yours could be next.
          </p>
        )}
      </main>

      <footer className="py-6 text-center text-xs opacity-30 text-white">
        Verified .edu only · Anonymous by default · No passwords
      </footer>
    </div>
  )
}
