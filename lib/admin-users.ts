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
