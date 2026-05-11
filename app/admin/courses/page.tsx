import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { CourseAdminManager } from '@/components/admin/CourseAdminManager'
import { getAdminViewer } from '@/lib/server-auth'
import { getAdminUniversity } from '@/lib/admin-context'
import { createAdminClient } from '@/lib/supabase/server'
import type { Course, Department } from '@/types/database'

type CourseWithDept = Course & { departments: { name: string } | null }

export default async function AdminCoursesPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await getAdminUniversity(viewer)
  if (!university) redirect('/admin')

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const [{ data: coursesData }, { data: deptData }] = await Promise.all([
    supabaseAny
      .from('courses')
      .select('*, departments(name)')
      .eq('university_id', university.id)
      .order('code'),
    supabase
      .from('departments')
      .select('*')
      .eq('university_id', university.id)
      .eq('is_board_category', false)
      .eq('active', true)
      .order('name'),
  ])

  const courses = (coursesData ?? []) as CourseWithDept[]
  const departments = (deptData ?? []) as Department[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Manage courses</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Add and edit courses so students can write reviews and start discussions.
            </p>
          </div>
        </div>

        <CourseAdminManager courses={courses} departments={departments} />
      </main>
    </div>
  )
}
