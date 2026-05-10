import type { User } from '@/types/database'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import {
  getDevBypassEmail,
  getDevBypassEmailHash,
  hasDevBypassCookie,
} from '@/lib/dev-bypass'

export interface AppViewer extends User {
  email: string | null
  isDevBypass: boolean
}

function readSessionFromCookie(): { access_token: string; user: { id: string; email: string } } | null {
  const cookieStore = cookies()
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace('https://', '')
    .split('.')[0]
  const authCookie = cookieStore.get(`sb-${projectRef}-auth-token`)
  if (!authCookie?.value) return null
  try {
    const session = JSON.parse(authCookie.value)
    if (!session?.access_token || !session?.user?.id) return null
    return session
  } catch {
    return null
  }
}

export async function getOptionalViewer(): Promise<AppViewer | null> {
  if (hasDevBypassCookie()) {
    const adminSupabase = createAdminClient()
    const { data: profileData } = await adminSupabase
      .from('users')
      .select('*')
      .eq('email_hash', getDevBypassEmailHash())
      .single()
    const profile = profileData as User | null
    if (!profile) return null
    return { ...profile, email: getDevBypassEmail(), isDevBypass: true }
  }

  const session = readSessionFromCookie()
  if (!session) return null

  const adminSupabase = createAdminClient()

  // Verify token is still valid
  const { data: { user }, error } = await adminSupabase.auth.getUser(session.access_token)
  if (error || !user) return null

  const { data: profileData } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as User | null
  if (!profile) return null

  return {
    ...profile,
    email: user.email?.toLowerCase() ?? null,
    isDevBypass: false,
  }
}

export async function getActionClient() {
  const viewer = await getOptionalViewer()
  return {
    viewer,
    supabase: viewer?.isDevBypass ? createAdminClient() : createClient(),
  }
}

export async function getAdminViewer() {
  const viewer = await getOptionalViewer()
  if (!viewer || viewer.role !== 'admin') return null
  return viewer
}
