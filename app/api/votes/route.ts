import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient, requireViewer } from '@/lib/server-auth'

const VoteSchema = z.object({
  type: z.enum(['post', 'comment']),
  id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const parsed = VoteSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { type, id } = parsed.data

  // Cross-school check: a user can only vote on content in their own school.
  // Global admins exempt.
  if (viewer.role !== 'admin') {
    if (type === 'post') {
      const { data: post } = await supabase.from('posts').select('university_id').eq('id', id).maybeSingle()
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      if ((post as { university_id: string }).university_id !== viewer.university_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      const { data: row } = await (supabase as any)
        .from('comments')
        .select('posts!inner(university_id)')
        .eq('id', id)
        .maybeSingle()
      const uni = row?.posts?.university_id
      if (!uni) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      if (uni !== viewer.university_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  if (type === 'post') {
    const { data: existing } = await supabase.from('post_votes').select('*').eq('post_id', id).eq('user_id', viewer.id).maybeSingle()
    if (existing) {
      await supabase.from('post_votes').delete().eq('post_id', id).eq('user_id', viewer.id)
      return NextResponse.json({ voted: false })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('post_votes').insert({ post_id: id, user_id: viewer.id } as any)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data: existing } = await supabase.from('comment_votes').select('*').eq('comment_id', id).eq('user_id', viewer.id).maybeSingle()
    if (existing) {
      await supabase.from('comment_votes').delete().eq('comment_id', id).eq('user_id', viewer.id)
      return NextResponse.json({ voted: false })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('comment_votes').insert({ comment_id: id, user_id: viewer.id } as any)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ voted: true })
}

export async function GET(req: NextRequest) {
  // GET is read-only count + did-I-vote. Auth optional (count is public,
  // vote status is per-viewer). No suspension check needed for a read.
  const { viewer, supabase } = await getActionClient()

  const url    = new URL(req.url)
  const type   = url.searchParams.get('type') as 'post' | 'comment' | null
  const id     = url.searchParams.get('id')

  if (!type || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  let count = 0
  let voted = false

  if (type === 'post') {
    const { count: c } = await supabase.from('post_votes').select('*', { count: 'exact', head: true }).eq('post_id', id)
    count = c ?? 0
    if (viewer) {
      const { data } = await supabase.from('post_votes').select('*').eq('post_id', id).eq('user_id', viewer.id).maybeSingle()
      voted = !!data
    }
  } else {
    const { count: c } = await supabase.from('comment_votes').select('*', { count: 'exact', head: true }).eq('comment_id', id)
    count = c ?? 0
    if (viewer) {
      const { data } = await supabase.from('comment_votes').select('*').eq('comment_id', id).eq('user_id', viewer.id).maybeSingle()
      voted = !!data
    }
  }

  return NextResponse.json({ count, voted })
}
