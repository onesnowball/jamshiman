import { notFound } from 'next/navigation'
import { CourseSearch } from '@/components/courses/CourseSearch'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'
import type { Course } from '@/types/database'

// Always fetch fresh — no cookies() call here so Next.js would otherwise
// cache the Supabase query and serve stale results after new courses are added.
export const dynamic = 'force-dynamic'

type CourseListItem = Course & {
  departments: { name: string | null } | null
  reviewCount: number
  discussionCount: number
}

export default async function CoursesPage({ params }: { params: { school: string } }) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const supabase = createAdminClient()

  const [{ data: coursesData }, { data: deptData }] = await Promise.all([
    (supabase as any)
      .from('courses')
      .select('*')
      .eq('university_id', university.id)
      .order('code')
      .limit(200),
    supabase
      .from('departments')
      .select('id, name')
      .eq('university_id', university.id),
  ])

  const deptMap = new Map(
    ((deptData ?? []) as Array<{ id: string; name: string }>).map(d => [d.id, d.name])
  )

  const courses = ((coursesData ?? []) as Course[]).map(c => ({
    ...c,
    departments: { name: deptMap.get(c.dept_id) ?? null },
  })) as (Course & { departments: { name: string | null } | null })[]

  const courseItems: CourseListItem[] = await Promise.all(courses.map(async course => {
    const [{ count: reviewCount }, { count: discussionCount }] = await Promise.all([
      supabase.from('course_reviews').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('status', 'active'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('board_type', 'course').eq('status', 'active'),
    ])
    return { ...course, reviewCount: reviewCount ?? 0, discussionCount: discussionCount ?? 0 }
  }))

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search by code or name, filter by department, read reviews and jump into class discussion.
        </p>
      </div>
      <CourseSearch courses={courseItems} school={params.school} />
    </main>
  )
}
