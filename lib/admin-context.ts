/**
 * Resolves which university an admin is currently managing.
 *
 * - Global admin  → reads the `last_school` cookie (set by middleware when
 *                   they visit any /:school/* page) and looks up that university.
 * - Campus admin  → uses their single campusAdminUniversityIds entry.
 *
 * Returns null when no school context is set (global admin hasn't visited a
 * school page yet); callers should redirect or show a warning in that case.
 */

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import type { AppViewer } from '@/lib/server-auth'
import { slugToDomain } from '@/lib/school-slugs'

export type AdminUniversity = { id: string; name: string; domain: string }

export async function getAdminUniversity(viewer: AppViewer): Promise<AdminUniversity | null> {
  const supabase = createAdminClient()

  if (viewer.role === 'admin') {
    // Global admin — derive from last visited school
    const lastSchool = cookies().get('last_school')?.value
    if (!lastSchool) return null
    const { data } = await supabase
      .from('universities')
      .select('id, name, domain')
      .eq('domain', slugToDomain(lastSchool))
      .single()
    return (data as AdminUniversity | null)
  }

  // Campus admin — always scoped to their university
  const universityId = viewer.campusAdminUniversityIds[0]
  if (!universityId) return null
  const { data } = await supabase
    .from('universities')
    .select('id, name, domain')
    .eq('id', universityId)
    .single()
  return (data as AdminUniversity | null)
}
