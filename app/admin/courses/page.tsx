import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { CourseAdminManager } from '@/components/admin/CourseAdminManager'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import type { Course, Department } from '@/types/database'

type CourseWithDept = Course & { departments: { name: string } | null }

export default async function AdminCoursesPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const isGlobalAdmin = viewer.role === 'admin'
  const adminUniversityIds = isGlobalAdmin ? null : viewer.campusAdminUniversityIds

  let deptQuery = supabase.from('departments').select('*').eq('active', true).order('name')
  if (adminUniversityIds) deptQuery = (deptQuery as any).in('university_id', adminUniversityIds)

  const [{ data: coursesData }, { data: deptData }] = await Promise.all([
    supabaseAny.from('courses').select('*, departments(name)').order('code'),
    deptQuery,
  ])

  const allCourses = (coursesData ?? []) as CourseWithDept[]
  const departments = (deptData ?? []) as Department[]
  const deptIds = new Set(departments.map(d => d.id))

  // Scope courses to the admin's universities via their departments
  const courses = isGlobalAdmin ? allCourses : allCourses.filter(c => deptIds.has(c.dept_id))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <div>
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
