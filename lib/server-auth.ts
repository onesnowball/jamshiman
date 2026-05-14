import type { User } from '@/types/database'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  getDevBypassEmail,
  getDevBypassEmailHash,
  hasDevBypassCookie,
} from '@/lib/dev-bypass'

export interface AppViewer extends User {
  email: string | null
  isDevBypass: boolean
  campusAdminUniversityIds: string[]  // universities this user is campus admin for
}

export async function getOptionalViewer(): Promise<AppViewer | null> {
  const adminSupabase = createAdminClient()

  if (hasDevBypassCookie()) {
    const { data: profileData } = await adminSupabase
      .from('users')
      .select('*')
      .eq('email_hash', getDevBypassEmailHash())
      .single()
    const profile = profileData as User | null
    if (!profile) return null
    const campusAdminUniversityIds = await getCampusAdminUniversityIds(profile.id, adminSupabase)
    return { ...profile, email: getDevBypassEmail(), isDevBypass: true, campusAdminUniversityIds }
  }

  // Use the cookie-aware SSR client. After middleware refresh, this returns
  // a valid user even if the access token has rolled over.
  const cookieClient = createClient()
  const { data: { user }, error } = await cookieClient.auth.getUser()
  if (error || !user) return null

  const { data: profileData } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as User | null
  if (!profile) return null

  const campusAdminUniversityIds = await getCampusAdminUniversityIds(user.id, adminSupabase)

  return {
    ...profile,
    email: user.email?.toLowerCase() ?? null,
    isDevBypass: false,
    campusAdminUniversityIds,
  }
}

async function getCampusAdminUniversityIds(userId: string, supabase: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data } = await (supabase as any)
    .from('campus_admins')
    .select('university_id')
    .eq('user_id', userId)
  return ((data ?? []) as Array<{ university_id: string }>).map(r => r.university_id)
}

export async function getActionClient() {
  const viewer = await getOptionalViewer()
  // Mutations continue to use the service-role admin client because the
  // codebase does not rely on RLS for writes — every API route explicitly
  // checks auth (above), school scope, suspension, and ownership.
  return {
    viewer,
    supabase: createAdminClient(),
  }
}

export async function getAdminViewer() {
  const viewer = await getOptionalViewer()
  if (!viewer) return null
  // Global admin OR campus admin for at least one university
  if (viewer.role !== 'admin' && viewer.campusAdminUniversityIds.length === 0) return null
  return viewer
}

/** True if this viewer can admin a specific university */
export function canAdminUniversity(viewer: AppViewer, universityId: string): boolean {
  if (viewer.role === 'admin') return true
  return viewer.campusAdminUniversityIds.includes(universityId)
}
