import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { AdvisorSearch } from '@/components/advisors/AdvisorSearch'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { canonicalSchoolSlug, domainToSlug } from '@/lib/school-slugs'
import { buildExtraDeptNamesByAdvisor, formatAdvisorDepartmentLine } from '@/lib/advisor-departments'

export default async function AdvisorsPage({
  searchParams,
}: {
  searchParams?: { uni?: string }
}) {
  const supabase = createAdminClient()
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const lastSchool = cookies().get('last_school')?.value
  if (lastSchool) redirect(`/${canonicalSchoolSlug(lastSchool)}/advisors`)

  const { data: viewerUniversity } = await supabase
    .from('universities')
    .select('domain')
    .eq('id', viewer.university_id)
    .single()
  if (viewerUniversity) redirect(`/${domainToSlug((viewerUniversity as { domain: string }).domain)}/advisors`)

  const isGlobalAdmin = viewer?.role === 'admin'

  let scopedUniversityId: string | null = null
  if (isGlobalAdmin) {
    const uniDomain = searchParams?.uni ?? cookies().get('active_uni')?.value ?? null
    if (uniDomain) {
      const { data: uniRow } = await supabase
        .from('universities')
        .select('id')
        .eq('domain', uniDomain)
        .single()
      scopedUniversityId = (uniRow as { id: string } | null)?.id ?? null
    }
  }
  const effectiveUniversityId = scopedUniversityId ?? viewer?.university_id ?? null

  let advisorQuery = supabase
    .from('advisors')
    .select('*, departments(name)')
    .eq('active', true)
    .order('name')
  if (!isGlobalAdmin || scopedUniversityId) {
    if (effectiveUniversityId) advisorQuery = advisorQuery.eq('university_id', effectiveUniversityId)
  }

  const [{ data: advisorsData }, { data: aggData }] = await Promise.all([
    advisorQuery,
    (supabase as any)
      .from('advisor_aggregates')
      .select('advisor_id, review_count, avg_overall'),
  ])

  const aggMap = new Map(
    ((aggData ?? []) as Array<{ advisor_id: string; review_count: number; avg_overall: number }>)
      .map(a => [a.advisor_id, a])
  )

  const advisorsRaw = ((advisorsData ?? []) as any[])

  let advisors
  if (effectiveUniversityId && advisorsRaw.length) {
    const { data: deptRows } = await supabase
      .from('departments')
      .select('id, name')
      .eq('university_id', effectiveUniversityId)
    const deptMap = new Map(((deptRows ?? []) as { id: string; name: string }[]).map(d => [d.id, d.name]))
    const ids = advisorsRaw.map(a => a.id)
    const { data: affData, error: affErr } = await (supabase as any)
      .from('advisor_department_affiliations')
      .select('advisor_id, dept_id')
      .in('advisor_id', ids)
    const extraNamesByAdvisor = affErr
      ? new Map<string, string[]>()
      : buildExtraDeptNamesByAdvisor(
          (affData ?? []) as { advisor_id: string; dept_id: string }[],
          deptMap
        )
    advisors = advisorsRaw.map(a => ({
      ...a,
      departmentLabel: formatAdvisorDepartmentLine(
        deptMap.get(a.dept_id) ?? a.departments?.name ?? null,
        extraNamesByAdvisor.get(a.id)
      ),
      advisor_aggregates: aggMap.get(a.id) ?? null,
    }))
  } else {
    advisors = advisorsRaw.map(a => ({
      ...a,
      departmentLabel: formatAdvisorDepartmentLine(a.departments?.name ?? null, undefined),
      advisor_aggregates: aggMap.get(a.id) ?? null,
    }))
  }

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
