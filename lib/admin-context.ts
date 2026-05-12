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
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import type { AppViewer } from '@/lib/server-auth'
import { domainToSlug, slugToDomain } from '@/lib/school-slugs'

export type AdminUniversity = { id: string; name: string; domain: string }

export async function getAdminUniversityBySlug(
  viewer: AppViewer,
  schoolSlug: string
): Promise<AdminUniversity | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('universities')
    .select('id, name, domain')
    .eq('domain', slugToDomain(schoolSlug))
    .eq('active', true)
    .single()

  const university = data as AdminUniversity | null
  if (!university) return null
  if (viewer.role === 'admin') return university
  return viewer.campusAdminUniversityIds.includes(university.id) ? university : null
}

export async function getAdminFallbackSlug(viewer: AppViewer): Promise<string | null> {
  const supabase = createAdminClient()

  if (viewer.role === 'admin') {
    const lastSchool = cookies().get('last_school')?.value
    if (lastSchool) {
      const university = await getAdminUniversityBySlug(viewer, lastSchool)
      if (university) return domainToSlug(university.domain)
    }

    if (viewer.university_id) {
      const { data: homeUniversity } = await supabase
        .from('universities')
        .select('domain')
        .eq('id', viewer.university_id)
        .eq('active', true)
        .single()
      if (homeUniversity) return domainToSlug((homeUniversity as { domain: string }).domain)
    }

    const { data } = await supabase
      .from('universities')
      .select('domain')
      .eq('active', true)
      .order('name')
      .limit(1)
      .single()
    return data ? domainToSlug((data as { domain: string }).domain) : null
  }

  const universityId = viewer.campusAdminUniversityIds[0]
  if (!universityId) return null
  const { data } = await supabase
    .from('universities')
    .select('domain')
    .eq('id', universityId)
    .single()
  return data ? domainToSlug((data as { domain: string }).domain) : null
}

export async function requireAdminUniversity(
  viewer: AppViewer,
  schoolSlug: string
): Promise<AdminUniversity> {
  const university = await getAdminUniversityBySlug(viewer, schoolSlug)
  if (university) return university

  const fallback = await getAdminFallbackSlug(viewer)
  if (fallback) redirect(`/${fallback}/admin`)

  redirect('/auth/login')
}

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
