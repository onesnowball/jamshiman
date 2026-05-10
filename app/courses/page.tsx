import Link from 'next/link'
import { GraduationCap, MessageSquare, Search } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import type { Course } from '@/types/database'

type CourseListItem = Course & {
  departments: { name: string | null } | null
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = createClient()
  const q = searchParams.q?.trim()

  let query = supabase
    .from('courses')
    .select('*, departments(name)')
    .order('code')
    .limit(50)

  if (q) {
    query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%`)
  }

  const { data: coursesData } = await query
  const courses = (coursesData ?? []) as CourseListItem[]

  const courseCards = await Promise.all(courses.map(async course => {
    const [{ count: reviewCount }, { count: discussionCount }] = await Promise.all([
      supabase
        .from('course_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('status', 'active'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('board_type', 'course')
        .eq('status', 'active'),
    ])

    return {
      ...course,
      reviewCount: reviewCount ?? 0,
      discussionCount: discussionCount ?? 0,
    }
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Course reviews</h1>
          <p className="text-gray-500 text-sm">
            Search UMich courses by code or title, compare class reality, and jump into live course discussion when classmates are active.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form>
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search by course code or name..."
              className="input pl-9"
            />
          </form>
        </div>

        {!courseCards.length ? (
          <div className="card p-10 text-center text-gray-400">
            <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-700">No courses matched that search.</p>
            <p className="text-xs mt-1">
              Seed the first launch catalog in Supabase, then they’ll appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {courseCards.map(course => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="card p-5 flex items-start justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{course.code}</p>
                  <h2 className="text-lg font-medium text-gray-900 mt-0.5">{course.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.departments?.name ?? 'Department pending'}
                    {course.credits ? ` · ${course.credits} credits` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="badge-gray">
                      {course.reviewCount} review{course.reviewCount === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                      {course.discussionCount} discussion{course.discussionCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400 mt-2">
                    {course.reviewCount >= 3 ? 'Public reviews live' : 'Needs 3 reviews to unlock'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {course.discussionCount ? 'Classmates are talking' : 'No course threads yet'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
