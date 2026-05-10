'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, FlaskConical, Users } from 'lucide-react'
import { RatingDisplay } from '@/components/ui/StarRating'

type AdvisorItem = {
  id: string
  name: string
  title: string | null
  lab_name: string | null
  research_areas: string[]
  departments: { name: string } | null
  advisor_aggregates: {
    review_count: number
    avg_overall: number
  } | null
}

export function AdvisorSearch({ advisors, school }: { advisors: AdvisorItem[]; school?: string }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return advisors
    return advisors.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.lab_name?.toLowerCase().includes(q) ||
      a.research_areas?.some(area => area.toLowerCase().includes(q)) ||
      a.departments?.name.toLowerCase().includes(q)
    )
  }, [advisors, query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, lab, or research area…"
          className="input pl-9"
        />
      </div>

      {query && (
        <p className="text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
        </p>
      )}

      {!filtered.length ? (
        <div className="card p-10 text-center text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-700">No advisors found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(advisor => {
            const stats = advisor.advisor_aggregates
            const hasReviews = (stats?.review_count ?? 0) >= 1
            return (
              <Link
                key={advisor.id}
                href={school ? `/${school}/advisors/${advisor.id}` : `/advisors/${advisor.id}`}
                className="card p-4 flex items-start gap-4 hover:border-brand-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-sm flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                  {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">
                        {advisor.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {advisor.departments?.name}
                        {advisor.title ? ` · ${advisor.title}` : ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {hasReviews ? (
                        <RatingDisplay value={parseFloat(String(stats!.avg_overall))} count={stats!.review_count} />
                      ) : (
                        <span className="text-xs text-gray-400">No reviews yet</span>
                      )}
                    </div>
                  </div>

                  {advisor.lab_name && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <FlaskConical className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{advisor.lab_name}</span>
                    </div>
                  )}

                  {advisor.research_areas?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {advisor.research_areas.slice(0, 4).map((area: string) => (
                        <span key={area} className="badge-gray text-[10px]">{area}</span>
                      ))}
                      {advisor.research_areas.length > 4 && (
                        <span className="badge-gray text-[10px]">+{advisor.research_areas.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
