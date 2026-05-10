import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

const VoteSchema = z.object({
  type: z.enum(['post', 'comment']),
  id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = VoteSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { type, id } = parsed.data

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
