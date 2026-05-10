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

    return {
      ...profile,
      email: getDevBypassEmail(),
      isDevBypass: true,
    }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileData } = await supabase
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
