import { redirect } from 'next/navigation'
import { Layers } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'
import { DepartmentAdminManager } from '@/components/admin/DepartmentAdminManager'
import type { Department } from '@/types/database'

export default async function AdminDepartmentsPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  const [{ data: deptData }, { data: uniData }] = await Promise.all([
    (supabase as any)
      .from('departments')
      .select('*, universities(name)')
      .order('name'),
    supabase.from('universities').select('id, name, domain').eq('active', true).order('name'),
  ])

  const allDepts = (deptData ?? []) as (Department & { universities: { name: string } | null })[]
  const universities = (uniData ?? []) as Array<{ id: string; name: string; domain: string }>

  // Scope to admin's universities
  const adminUniversityIds = isGlobalAdmin
    ? universities.map(u => u.id)
    : viewer.campusAdminUniversityIds

  const departments = allDepts.filter(d => adminUniversityIds.includes(d.university_id))
  const visibleUniversities = universities.filter(u => adminUniversityIds.includes(u.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-brand-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage board categories and academic departments per university.
            </p>
          </div>
        </div>

        <DepartmentAdminManager
          departments={departments}
          universities={visibleUniversities}
          isGlobalAdmin={isGlobalAdmin}
        />
      </main>
    </div>
  )
}
