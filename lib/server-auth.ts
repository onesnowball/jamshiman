import type { User } from '@/types/database'
import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isOnboarded } from '@/lib/onboarding'
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
  //
  // SECURITY: `supabase` returned here is the SERVICE-ROLE admin client.
  // Any read OR write performed against it bypasses RLS. New routes
  // should prefer `requireViewer()` below, which bundles the standard
  // auth + suspension + onboarding guards before exposing the client.
  return {
    viewer,
    supabase: createAdminClient(),
  }
}

/**
 * Canonical mutation/read guard. Returns either the authenticated viewer
 * + admin Supabase client, or a ready-to-return error response.
 *
 * Usage:
 *
 *     const auth = await requireViewer()
 *     if (auth.error) return auth.error
 *     const { viewer, supabase } = auth
 *
 * Bundles three checks every authenticated user-facing route needs:
 *   - authenticated (401 otherwise)
 *   - not banned (403 otherwise)
 *   - onboarding complete (403 otherwise)
 *
 * Routes that must accept un-onboarded viewers (e.g. /api/profile/onboarding
 * itself, or /api/auth/setup) should NOT use this — they fall back to
 * `getActionClient()` + manual checks.
 */
export async function requireViewer(): Promise<
  | { viewer: AppViewer; supabase: ReturnType<typeof createAdminClient>; error: null }
  | { viewer: null; supabase: null; error: NextResponse }
> {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return { viewer: null, supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (viewer.is_banned) {
    return { viewer: null, supabase: null, error: NextResponse.json({ error: 'Account suspended' }, { status: 403 }) }
  }
  if (!isOnboarded(viewer)) {
    return { viewer: null, supabase: null, error: NextResponse.json({ error: 'Onboarding required' }, { status: 403 }) }
  }
  return { viewer, supabase, error: null }
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
