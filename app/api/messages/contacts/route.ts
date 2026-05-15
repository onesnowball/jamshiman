/**
 * GET /api/messages/contacts
 *
 * Returns a list of users the viewer can message — i.e. non-anonymous post
 * authors from the viewer's university, excluding themselves.
 * Each entry has { id, handle } where handle is the email-prefix.
 */
import { NextResponse } from 'next/server'
import { requireViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'

export async function GET() {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  // Find non-anonymous post authors from this university (excluding viewer)
  const { data: postsData } = await (supabase as any)
    .from('posts')
    .select('author_id')
    .eq('university_id', viewer.university_id)
    .eq('is_anonymous', false)
    .neq('author_id', viewer.id)
    .limit(200)

  const authorIds = Array.from(
    new Set(((postsData ?? []) as Array<{ author_id: string }>).map(p => p.author_id))
  )

  if (!authorIds.length) return NextResponse.json({ contacts: [] })

  const emailMap = await getAuthEmailMap(authorIds)

  const contacts = authorIds.map(id => ({
    id,
    handle: toPublicHandle(emailMap.get(id)),
  })).sort((a, b) => a.handle.localeCompare(b.handle))

  return NextResponse.json({ contacts })
}
