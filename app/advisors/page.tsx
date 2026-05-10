import { Navbar } from '@/components/Navbar'
import { AdvisorSearch } from '@/components/advisors/AdvisorSearch'
import { createAdminClient } from '@/lib/supabase/server'

export default async function AdvisorsPage() {
  const supabase = createAdminClient()

  const [{ data: advisorsData }, { data: aggData }] = await Promise.all([
    supabase
      .from('advisors')
      .select('*, departments(name)')
      .eq('active', true)
      .order('name')
      .limit(200),
    (supabase as any)
      .from('advisor_aggregates')
      .select('advisor_id, review_count, avg_overall'),
  ])

  const aggMap = new Map(
    ((aggData ?? []) as Array<{ advisor_id: string; review_count: number; avg_overall: number }>)
      .map(a => [a.advisor_id, a])
  )

  const advisors = ((advisorsData ?? []) as any[]).map(a => ({
    ...a,
    advisor_aggregates: aggMap.get(a.id) ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Advisors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Anonymous reviews from verified UMich students — lab members, collaborators, and committee students.
          </p>
        </div>
        <AdvisorSearch advisors={advisors} />
      </main>
    </div>
  )
}
