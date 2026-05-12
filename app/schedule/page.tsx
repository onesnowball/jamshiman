import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ScheduleBuilder } from '@/components/schedule/ScheduleBuilder'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { domainToSlug } from '@/lib/school-slugs'
import type { Course, Schedule, ScheduleCourse } from '@/types/database'

type ScheduleBlockRow = ScheduleCourse & {
  courses: Pick<Course, 'code' | 'name'> | null
}

type ScheduleWithBlocks = Schedule & {
  schedule_courses: ScheduleBlockRow[]
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { schedule?: string }
}) {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = viewer.isDevBypass ? createAdminClient() : createClient()
  const { data: viewerUniversity } = await createAdminClient()
    .from('universities')
    .select('domain')
    .eq('id', viewer.university_id)
    .single()
  if (viewerUniversity) redirect(`/${domainToSlug((viewerUniversity as { domain: string }).domain)}/schedule`)

  const [{ data: schedulesData }, { data: coursesData }] = await Promise.all([
    supabase
      .from('schedules')
      .select('*, schedule_courses(*, courses(code, name))')
      .eq('user_id', viewer.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('courses')
      .select('*')
      .order('code')
      .limit(300),
  ])

  const schedules = (schedulesData ?? []) as ScheduleWithBlocks[]
  const courses = (coursesData ?? []) as Course[]

  const selectedScheduleId = schedules.some(schedule => schedule.id === searchParams.schedule)
    ? searchParams.schedule
    : schedules[0]?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 page-enter space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schedule builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Build a private weekly plan from seeded courses and manually-entered meeting times.
          </p>
        </div>

        <ScheduleBuilder
          schedules={schedules}
          courses={courses}
          initialScheduleId={selectedScheduleId}
        />
      </main>
    </div>
  )
}
