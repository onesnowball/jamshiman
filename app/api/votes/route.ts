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
  const table = type === 'post' ? 'post_votes' : 'comment_votes'
  const col   = type === 'post' ? 'post_id'   : 'comment_id'

  const { data: existing } = await supabase
    .from(table)
    .select('*')
    .eq(col, id)
    .eq('user_id', viewer.id)
    .maybeSingle()

  if (existing) {
    await supabase.from(table).delete().eq(col, id).eq('user_id', viewer.id)
    return NextResponse.json({ voted: false })
  }

  const { error } = await supabase.from(table).insert({ [col]: id, user_id: viewer.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ voted: true })
}

export async function GET(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()

  const url    = new URL(req.url)
  const type   = url.searchParams.get('type') as 'post' | 'comment' | null
  const id     = url.searchParams.get('id')

  if (!type || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const table = type === 'post' ? 'post_votes' : 'comment_votes'
  const col   = type === 'post' ? 'post_id'    : 'comment_id'

  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(col, id)

  let voted = false
  if (viewer) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq(col, id)
      .eq('user_id', viewer.id)
      .maybeSingle()
    voted = !!data
  }

  return NextResponse.json({ count: count ?? 0, voted })
}
