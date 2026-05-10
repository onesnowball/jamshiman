import { cache } from 'react'
import { createAdminClient } from './supabase/server'

export type UniversityRow = { id: string; name: string; domain: string }

/** Resolves school slug (e.g. "umich") → university row. Cached per request. */
export const getUniversityBySlug = cache(async (slug: string): Promise<UniversityRow | null> => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('universities')
    .select('id, name, domain')
    .eq('domain', `${slug}.edu`)
    .single()
  return (data as UniversityRow | null)
})

/** "umich.edu" → "umich" */
export function domainToSlug(domain: string) {
  return domain.split('.')[0]
}
