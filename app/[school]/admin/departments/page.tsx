import { redirect } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import { AcademicDeptManager } from '@/components/admin/AcademicDeptManager'
import type { Department } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminDepartmentsPage({ params }: { params: { school: string } }) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await requireAdminUniversity(viewer, params.school)

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  const { data: deptData } = await (supabase as any)
    .from('departments')
    .select('*, universities(name)')
    .eq('university_id', university.id)
    .eq('is_board_category', false)
    .order('active', { ascending: false })
    .order('name')

  const departments = (deptData ?? []) as (Department & { universities: { name: string } | null })[]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Academic Departments</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Departments used to organise advisors, courses, and dept-level boards.
            </p>
          </div>
        </div>

        <AcademicDeptManager
          departments={departments}
          universities={[university]}
          isGlobalAdmin={isGlobalAdmin}
        />
      </main>
    </div>
  )
}
