import { redirect } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import { AdvisorAdminManager } from '@/components/admin/AdvisorAdminManager'
import type { Advisor, Department } from '@/types/database'

type AdminAdvisor = Advisor & {
  departments: { name: string | null } | null
}

export default async function AdminAdvisorsPage({ params }: { params: { school: string } }) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await requireAdminUniversity(viewer, params.school)

  const supabase = createAdminClient()

  const [{ data: advisorsData }, { data: departmentsData }] = await Promise.all([
    (supabase as any)
      .from('advisors')
      .select('*, departments(name)')
      .eq('university_id', university.id)
      .order('active', { ascending: false })
      .order('name'),
    supabase
      .from('departments')
      .select('*')
      .eq('university_id', university.id)
      .eq('is_board_category', false)
      .eq('active', true)
      .order('name'),
  ])

  const advisors = (advisorsData ?? []) as AdminAdvisor[]
  const departments = (departmentsData ?? []) as Department[]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8 page-enter space-y-6">
        <div className="flex items-center gap-3">
          <UserCog className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Manage advisors</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create listings, correct metadata, and deactivate advisors without deleting history.
            </p>
          </div>
        </div>

        <AdvisorAdminManager advisors={advisors} departments={departments} />
      </main>
    </div>
  )
}
