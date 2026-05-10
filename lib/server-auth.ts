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
  const key = `sb-${projectRef}-auth-token`

  // @supabase/ssr chunks large cookies as key.0, key.1, ...
  // Try unchunked first, then reassemble chunks if needed.
  const raw = cookieStore.get(key)?.value ?? (() => {
    const parts: string[] = []
    for (let i = 0; ; i++) {
      const chunk = cookieStore.get(`${key}.${i}`)?.value
      if (!chunk) break
      parts.push(chunk)
    }
    return parts.length ? parts.join('') : null
  })()

  if (!raw) return null
  try {
    const session = JSON.parse(raw)
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
  // Always use the admin client for mutations — @supabase/ssr@0.3.0 cannot
  // reliably attach the auth token to anon-client requests, so auth.uid()
  // returns null and RLS insert/update policies always fail.
  // Authentication is already enforced above via getOptionalViewer().
  return {
    viewer,
    supabase: createAdminClient(),
  }
}

export async function getAdminViewer() {
  const viewer = await getOptionalViewer()
  if (!viewer || viewer.role !== 'admin') return null
  return viewer
}
