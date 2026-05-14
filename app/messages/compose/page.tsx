import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { getOptionalViewer } from '@/lib/server-auth'
import { isOnboarded } from '@/lib/onboarding'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { ComposeSearch } from '@/components/messages/ComposeSearch'

export default async function ComposePage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')
  if (!isOnboarded(viewer as any)) redirect('/profile/onboarding')

  const db = createAdminClient() as any

  // Non-anonymous post authors from viewer's university (excluding self)
  const { data: postsData } = await db
    .from('posts')
    .select('author_id')
    .eq('university_id', viewer.university_id)
    .eq('is_anonymous', false)
    .neq('author_id', viewer.id)
    .limit(200)

  const authorIds = Array.from(
    new Set(((postsData ?? []) as Array<{ author_id: string }>).map((p: any) => p.author_id as string))
  )

  const emailMap = authorIds.length ? await getAuthEmailMap(authorIds) : new Map<string, string>()

  const contacts = authorIds
    .map(id => ({ id, handle: toPublicHandle(emailMap.get(id)) }))
    .sort((a, b) => a.handle.localeCompare(b.handle))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 page-enter">
        <ComposeSearch contacts={contacts} />
      </main>
    </div>
  )
}
