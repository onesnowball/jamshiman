import { redirect } from 'next/navigation'
import { ScheduleBuilder } from '@/components/schedule/ScheduleBuilder'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getUniversityBySlug } from '@/lib/school'
import type { Course, Schedule, ScheduleCourse } from '@/types/database'

type ScheduleBlockRow = ScheduleCourse & { courses: Pick<Course, 'code' | 'name'> | null }
type ScheduleWithBlocks = Schedule & { schedule_courses: ScheduleBlockRow[] }

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: { school: string }
  searchParams: { schedule?: string }
}) {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect(`/auth/login?school=${params.school}.edu`)

  const university = await getUniversityBySlug(params.school)
  const supabase = createAdminClient()

  const [{ data: schedulesData }, { data: coursesData }] = await Promise.all([
    supabase
      .from('schedules')
      .select('*, schedule_courses(*, courses(code, name))')
      .eq('user_id', viewer.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('courses')
      .select('*')
      .eq('university_id', university?.id ?? '')
      .order('code')
      .limit(300),
  ])

  const schedules = (schedulesData ?? []) as ScheduleWithBlocks[]
  const courses = (coursesData ?? []) as Course[]
  const selectedScheduleId = schedules.some(s => s.id === searchParams.schedule)
    ? searchParams.schedule
    : schedules[0]?.id

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Schedule builder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Build a private weekly plan from seeded courses and manually-entered meeting times.
        </p>
      </div>
      <ScheduleBuilder schedules={schedules} courses={courses} initialScheduleId={selectedScheduleId} />
    </main>
  )
}
