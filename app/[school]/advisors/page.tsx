import { AdvisorSearch } from '@/components/advisors/AdvisorSearch'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'
import { notFound } from 'next/navigation'

// Always fetch fresh — no cookies() call here so Next.js would otherwise
// cache the Supabase query and serve stale results after new advisors are added.
export const dynamic = 'force-dynamic'

export default async function AdvisorsPage({ params }: { params: { school: string } }) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const supabase = createAdminClient()

  const [{ data: advisorsData }, { data: aggData }] = await Promise.all([
    supabase
      .from('advisors')
      .select('*, departments(name)')
      .eq('active', true)
      .eq('university_id', university.id)
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
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Advisors</h1>
        <p className="text-sm text-gray-500 mt-1">
          Anonymous reviews from verified {university.name} students — lab members, collaborators, and committee students.
        </p>
        {/* TEMP DEBUG — remove after diagnosing */}
        <p className="text-xs text-red-400 mt-1">dbg: uni={university.id} count={advisors.length}</p>
      </div>
      <AdvisorSearch advisors={advisors} school={params.school} />
    </main>
  )
}
