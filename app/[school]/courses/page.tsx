import { notFound } from 'next/navigation'
import { CourseSearch } from '@/components/courses/CourseSearch'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'
import type { Course, CourseRatings } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CourseListItem = Course & {
  departments: { name: string | null } | null
  reviewCount: number
  discussionCount: number
  avgRatings: CourseRatings | null
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: { school: string }
  searchParams?: { dept?: string }
}) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const supabase = createAdminClient()

  let activeDept: { id: string; slug: string; name: string } | null = null
  if (searchParams?.dept) {
    const { data: deptRow } = await supabase
      .from('departments')
      .select('id, slug, name')
      .eq('university_id', university.id)
      .eq('is_board_category', false)
      .eq('slug', searchParams.dept)
      .maybeSingle()
    if (deptRow) activeDept = deptRow as { id: string; slug: string; name: string }
  }

  let coursesQuery = (supabase as any)
    .from('courses')
    .select('*')
    .eq('university_id', university.id)
    .order('code')
  if (activeDept) coursesQuery = coursesQuery.eq('dept_id', activeDept.id)
  else coursesQuery = coursesQuery.limit(500)

  const [{ data: coursesData }, { data: deptData }, { data: allPostsData }] = await Promise.all([
    coursesQuery,
    supabase
      .from('departments')
      .select('id, name')
      .eq('university_id', university.id),
    // Batch fetch all discussion post counts
    supabase
      .from('posts')
      .select('course_id')
      .eq('board_type', 'course')
      .eq('status', 'active')
      .eq('university_id', university.id),
  ])

  const deptMap = new Map(
    ((deptData ?? []) as Array<{ id: string; name: string }>).map(d => [d.id, d.name])
  )

  const courses = ((coursesData ?? []) as Course[]).map(c => ({
    ...c,
    departments: { name: deptMap.get(c.dept_id) ?? null },
  })) as (Course & { departments: { name: string | null } | null })[]

  const courseIds = courses.map(course => course.id)
  const { data: allReviewsData } = courseIds.length > 0
    ? await supabase
        .from('course_reviews')
        .select('course_id, ratings')
        .eq('status', 'active')
        .in('course_id', courseIds)
    : { data: [] }

  // Compute review stats per course from batch result
  const reviewStatsMap = new Map<string, { count: number; totals: CourseRatings }>()
  for (const r of (allReviewsData ?? []) as { course_id: string; ratings: CourseRatings }[]) {
    const entry = reviewStatsMap.get(r.course_id) ?? {
      count: 0,
      totals: { difficulty: 0, usefulness: 0, workload: 0, professor: 0 },
    }
    entry.count++
    entry.totals.difficulty   += r.ratings.difficulty
    entry.totals.usefulness   += r.ratings.usefulness
    entry.totals.workload     += r.ratings.workload
    entry.totals.professor    += r.ratings.professor
    reviewStatsMap.set(r.course_id, entry)
  }

  // Compute discussion counts per course from batch result
  const discussionCountMap = new Map<string, number>()
  for (const p of (allPostsData ?? []) as { course_id: string | null }[]) {
    if (!p.course_id) continue
    discussionCountMap.set(p.course_id, (discussionCountMap.get(p.course_id) ?? 0) + 1)
  }

  const courseItems: CourseListItem[] = courses.map(course => {
    const stats = reviewStatsMap.get(course.id)
    const avgRatings = stats && stats.count > 0 ? {
      difficulty:  stats.totals.difficulty  / stats.count,
      usefulness:  stats.totals.usefulness  / stats.count,
      workload:    stats.totals.workload    / stats.count,
      professor:   stats.totals.professor   / stats.count,
    } : null
    return {
      ...course,
      reviewCount:      stats?.count ?? 0,
      discussionCount:  discussionCountMap.get(course.id) ?? 0,
      avgRatings,
    }
  })

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search by code or name, filter by department, read reviews and jump into class discussion.
        </p>
      </div>
      <CourseSearch
        courses={courseItems}
        school={params.school}
        activeDept={activeDept ? { slug: activeDept.slug, name: activeDept.name } : null}
      />
    </main>
  )
}
