import { cache } from 'react'
import { createAdminClient } from './supabase/server'
import { canonicalSchoolPathSlug, slugToDomain, domainToSlug } from './school-slugs'

export type UniversityRow = { id: string; name: string; domain: string }

/** Resolves school slug (e.g. "umich", "uiuc") → university row. Cached per request. */
export const getUniversityBySlug = cache(async (slug: string): Promise<UniversityRow | null> => {
  const supabase = createAdminClient()
  const domain = slugToDomain(slug)
  const { data } = await supabase
    .from('universities')
    .select('id, name, domain')
    .eq('domain', domain)
    .single()
  return (data as UniversityRow | null)
})

export async function getValidUniversitySlug(slugOrDomain?: string | null): Promise<string | null> {
  const slug = canonicalSchoolPathSlug(slugOrDomain)
  if (!slug) return null

  const university = await getUniversityBySlug(slug)
  return university ? domainToSlug(university.domain) : null
}

export { domainToSlug, slugToDomain }
