import { createAdminClient } from '@/lib/supabase/server'

export async function getAuthEmailMap(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  if (!uniqueUserIds.length) return new Map<string, string>()

  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  })

  if (error) return new Map<string, string>()

  const emailMap = new Map<string, string>()
  data.users.forEach(user => {
    if (uniqueUserIds.includes(user.id) && user.email) {
      emailMap.set(user.id, user.email.toLowerCase())
    }
  })

  return emailMap
}

export function toPublicHandle(email: string | null | undefined) {
  if (!email) return 'Verified student'
  return email.split('@')[0]
}

/** Lookup handles for a list of user IDs from the users table. */
export async function getHandleMap(userIds: string[]): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  if (!uniqueIds.length) return new Map()

  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('users')
    .select('id, handle')
    .in('id', uniqueIds)

  const map = new Map<string, string | null>()
  ;((data ?? []) as Array<{ id: string; handle: string | null }>).forEach(u => {
    map.set(u.id, u.handle)
  })
  return map
}

/**
 * Get display name for a non-anonymous author.
 * Prefers handle, falls back to email prefix.
 */
export function getAuthorLabel(
  userId: string,
  handleMap: Map<string, string | null>,
  emailMap: Map<string, string>,
): string {
  return handleMap.get(userId) ?? toPublicHandle(emailMap.get(userId))
}
