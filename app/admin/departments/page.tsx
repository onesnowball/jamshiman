import { redirect } from 'next/navigation'
import { Layers } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { getAdminUniversity } from '@/lib/admin-context'
import { DepartmentAdminManager } from '@/components/admin/DepartmentAdminManager'
import type { Department } from '@/types/database'

export default async function AdminDepartmentsPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await getAdminUniversity(viewer)
  if (!university) redirect('/admin')

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  const { data: deptData } = await (supabase as any)
    .from('departments')
    .select('*, universities(name)')
    .eq('university_id', university.id)
    .order('name')

  const departments = (deptData ?? []) as (Department & { universities: { name: string } | null })[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage board categories and academic departments.
            </p>
          </div>
        </div>

        <DepartmentAdminManager
          departments={departments}
          universities={[university]}
          isGlobalAdmin={isGlobalAdmin}
        />
      </main>
    </div>
  )
}
