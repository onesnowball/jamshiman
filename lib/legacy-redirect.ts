import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { domainToSlug } from '@/lib/school-slugs'
import { getValidUniversitySlug } from '@/lib/school'

/**
 * Shared helper for the legacy root routes (/advisors, /boards, /courses,
 * /schedule). Each route used to render its own full page; they're now
 * thin redirects to the school-scoped version. This helper resolves the
 * best school slug to redirect to (last_school cookie → viewer's home
 * university → first redirect to /auth/login) and forwards search params.
 *
 * Call with the path suffix you want preserved, e.g.:
 *   await redirectToSchoolPath('advisors')
 *   await redirectToSchoolPath('boards/' + maybeDeptSlug)
 */
export async function redirectToSchoolPath(suffix: string, searchString?: string): Promise<never> {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const lastSchool = await getValidUniversitySlug(cookies().get('last_school')?.value)
  if (lastSchool) {
    const qs = searchString ? `?${searchString}` : ''
    redirect(`/${lastSchool}/${suffix}${qs}`)
  }

  const { data: uni } = await createAdminClient()
    .from('universities')
    .select('domain')
    .eq('id', viewer.university_id)
    .single()
  const slug = uni ? domainToSlug((uni as { domain: string }).domain) : 'umich'
  const qs = searchString ? `?${searchString}` : ''
  redirect(`/${slug}/${suffix}${qs}`)
}
