import { redirect } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import { AdvisorAdminManager } from '@/components/admin/AdvisorAdminManager'
import type { Advisor, Department } from '@/types/database'

export const dynamic = 'force-dynamic'

type AdminAdvisor = Advisor & {
  departments: { name: string | null } | null
  additional_dept_ids?: string[]
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
      .order('active', { ascending: false })
      .order('name'),
  ])

  const advisors = (advisorsData ?? []) as AdminAdvisor[]
  const advisorIds = advisors.map(a => a.id)
  const supabaseAny = supabase as any
  const { data: affData, error: affErr } = advisorIds.length
    ? await supabaseAny
        .from('advisor_department_affiliations')
        .select('advisor_id, dept_id')
        .in('advisor_id', advisorIds)
    : { data: [] as { advisor_id: string; dept_id: string }[], error: null }

  const affByAdvisor = new Map<string, string[]>()
  for (const row of (affErr ? [] : (affData ?? [])) as { advisor_id: string; dept_id: string }[]) {
    const list = affByAdvisor.get(row.advisor_id) ?? []
    list.push(row.dept_id)
    affByAdvisor.set(row.advisor_id, list)
  }

  const advisorsWithAff = advisors.map(a => ({
    ...a,
    additional_dept_ids: affByAdvisor.get(a.id) ?? [],
  }))

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

        <AdvisorAdminManager advisors={advisorsWithAff} departments={departments} schoolSlug={params.school} />
      </main>
    </div>
  )
}
