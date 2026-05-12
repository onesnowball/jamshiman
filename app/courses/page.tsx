import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { CourseSearch } from '@/components/courses/CourseSearch'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { canonicalSchoolSlug, domainToSlug } from '@/lib/school-slugs'
import type { Course } from '@/types/database'

type CourseListItem = Course & {
  departments: { name: string | null } | null
  reviewCount: number
  discussionCount: number
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: { uni?: string }
}) {
  const supabase = createAdminClient()
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const lastSchool = cookies().get('last_school')?.value
  if (lastSchool) redirect(`/${canonicalSchoolSlug(lastSchool)}/courses`)

  const { data: viewerUniversity } = await supabase
    .from('universities')
    .select('domain')
    .eq('id', viewer.university_id)
    .single()
  if (viewerUniversity) redirect(`/${domainToSlug((viewerUniversity as { domain: string }).domain)}/courses`)

  const isGlobalAdmin = viewer?.role === 'admin'

  let scopedUniversityId: string | null = null
  if (isGlobalAdmin) {
    const uniDomain = searchParams?.uni ?? cookies().get('active_uni')?.value ?? null
    if (uniDomain) {
      const { data: uniRow } = await supabase
        .from('universities')
        .select('id')
        .eq('domain', uniDomain)
        .single()
      scopedUniversityId = (uniRow as { id: string } | null)?.id ?? null
    }
  }
  const effectiveUniversityId = scopedUniversityId ?? viewer?.university_id ?? null

  let courseQuery = supabase
    .from('courses')
    .select('*, departments(name)')
    .order('code')
    .limit(200)
  if (!isGlobalAdmin || scopedUniversityId) {
    if (effectiveUniversityId) courseQuery = (courseQuery as any).eq('university_id', effectiveUniversityId)
  }

  const { data: coursesData } = await courseQuery
  const courses = (coursesData ?? []) as (Course & { departments: { name: string | null } | null })[]

  const courseItems: CourseListItem[] = await Promise.all(courses.map(async course => {
    const [{ count: reviewCount }, { count: discussionCount }] = await Promise.all([
      supabase.from('course_reviews').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('status', 'active'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('board_type', 'course').eq('status', 'active'),
    ])
    return { ...course, reviewCount: reviewCount ?? 0, discussionCount: discussionCount ?? 0 }
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search by code or name, filter by department, read reviews and jump into class discussion.
          </p>
        </div>
        <CourseSearch courses={courseItems} />
      </main>
    </div>
  )
}
