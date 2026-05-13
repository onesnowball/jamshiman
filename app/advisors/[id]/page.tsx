import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { domainToSlug } from '@/lib/school-slugs'

export const dynamic = 'force-dynamic'

export default async function LegacyAdvisorRedirectPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()

  const { data: advisor } = await supabase
    .from('advisors')
    .select('id, university_id')
    .eq('id', params.id)
    .eq('active', true)
    .single()

  if (!advisor) notFound()

  const { data: university } = await supabase
    .from('universities')
    .select('domain')
    .eq('id', (advisor as { university_id: string }).university_id)
    .eq('active', true)
    .single()

  if (!university) notFound()

  redirect(`/${domainToSlug((university as { domain: string }).domain)}/advisors/${params.id}`)
}
