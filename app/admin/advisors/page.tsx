import { redirect } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { AdvisorAdminManager } from '@/components/admin/AdvisorAdminManager'
import type { Advisor, Department } from '@/types/database'

type AdminAdvisor = Advisor & {
  departments: { name: string | null } | null
}

export default async function AdminAdvisorsPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = createAdminClient()
  const [{ data: advisorsData }, { data: departmentsData }] = await Promise.all([
    supabase
      .from('advisors')
      .select('*, departments(name)')
      .order('active', { ascending: false })
      .order('name'),
    supabase
      .from('departments')
      .select('*')
      .eq('active', true)
      .order('name'),
  ])

  const advisors = (advisorsData ?? []) as AdminAdvisor[]
  const departments = (departmentsData ?? []) as Department[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 page-enter space-y-6">
        <div className="flex items-center gap-3">
          <UserCog className="w-5 h-5 text-brand-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Manage advisors</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create launch listings, correct metadata, and deactivate advisors without deleting history.
            </p>
          </div>
        </div>

        <AdvisorAdminManager advisors={advisors} departments={departments} />
      </main>
    </div>
  )
}
