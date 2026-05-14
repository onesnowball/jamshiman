import { AdvisorSearch } from '@/components/advisors/AdvisorSearch'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'
import { buildExtraDeptNamesByAdvisor, formatAdvisorDepartmentLine } from '@/lib/advisor-departments'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

// Always fetch fresh — no cookies() call here so Next.js would otherwise
// cache the Supabase query and serve stale results after new advisors are added.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdvisorsPage({ params }: { params: { school: string } }) {
  noStore()
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const supabase = createAdminClient()

  const [{ data: advisorsData }, { data: deptData }, { data: aggData }] = await Promise.all([
    (supabase as any)
      .from('advisors')
      .select('*')
      .eq('active', true)
      .eq('university_id', university.id)
      .order('name'),
    supabase
      .from('departments')
      .select('id, name')
      .eq('university_id', university.id),
    (supabase as any)
      .from('advisor_aggregates')
      .select('advisor_id, review_count, avg_overall'),
  ])

  const deptMap = new Map(
    ((deptData ?? []) as Array<{ id: string; name: string }>).map(d => [d.id, d.name])
  )

  const aggMap = new Map(
    ((aggData ?? []) as Array<{ advisor_id: string; review_count: number; avg_overall: number }>)
      .map(a => [a.advisor_id, a])
  )

  const advisorsRaw = (advisorsData ?? []) as any[]
  const advisorIds = advisorsRaw.map(a => a.id)
  const { data: affData, error: affErr } = advisorIds.length
    ? await (supabase as any)
        .from('advisor_department_affiliations')
        .select('advisor_id, dept_id')
        .in('advisor_id', advisorIds)
    : { data: [] as { advisor_id: string; dept_id: string }[], error: null }

  const extraNamesByAdvisor = affErr
    ? new Map<string, string[]>()
    : buildExtraDeptNamesByAdvisor(
        (affData ?? []) as { advisor_id: string; dept_id: string }[],
        deptMap
      )

  const advisors = advisorsRaw.map(a => {
    const primaryName = deptMap.get(a.dept_id) ?? null
    const extras = extraNamesByAdvisor.get(a.id)
    return {
      ...a,
      departments: { name: primaryName },
      departmentLabel: formatAdvisorDepartmentLine(primaryName, extras),
      advisor_aggregates: aggMap.get(a.id) ?? null,
    }
  })

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Advisors</h1>
        <p className="text-sm text-gray-500 mt-1">
          Anonymous reviews from verified {university.name} students — lab members, collaborators, and committee students.
        </p>
      </div>
      <AdvisorSearch advisors={advisors} school={params.school} />
    </main>
  )
}
