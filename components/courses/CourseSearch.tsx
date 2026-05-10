'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, BookOpen } from 'lucide-react'
import type { Course } from '@/types/database'

type CourseListItem = Course & {
  departments: { name: string | null } | null
  reviewCount: number
  discussionCount: number
}

const DEPT_FILTERS = ['All', 'ME', 'EECS', 'AERO', 'IOE']

export function CourseSearch({ courses, school }: { courses: CourseListItem[]; school?: string }) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('All')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return courses.filter(c => {
      const matchesDept = dept === 'All' || c.code.startsWith(dept + ' ') || c.code.startsWith(dept + '-')
      const matchesQuery = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      return matchesDept && matchesQuery
    })
  }, [courses, query, dept])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by code or name…"
          className="input pl-9"
          autoFocus
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {DEPT_FILTERS.map(d => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              dept === d
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="card p-10 text-center text-gray-400">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-700">No courses found.</p>
          <p className="text-xs mt-1">Try a different search or department.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(course => (
            <Link
              key={course.id}
              href={school ? `/${school}/courses/${course.id}` : `/courses/${course.id}`}
              className="card p-4 flex items-center justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded font-mono">
                    {course.code}
                  </span>
                  {course.credits && (
                    <span className="text-xs text-gray-400">{course.credits} cr</span>
                  )}
                </div>
                <p className="font-medium text-gray-900 mt-1 group-hover:text-brand-700 transition-colors truncate">
                  {course.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{course.departments?.name ?? ''}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-500">
                {course.reviewCount > 0 && (
                  <span className="badge-gray">{course.reviewCount} review{course.reviewCount !== 1 ? 's' : ''}</span>
                )}
                {course.discussionCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-brand-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {course.discussionCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
