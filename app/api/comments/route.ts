import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(3).max(3000),
  is_anonymous: z.boolean(),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'You need to sign in to comment.' }, { status: 401 })
  }

  if (viewer.is_banned) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('comments')
    .insert({
      post_id: parsed.data.post_id,
      author_id: viewer.id,
      body: parsed.data.body.trim(),
      is_anonymous: parsed.data.is_anonymous,
      status: 'active',
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not add comment.' }, { status: 500 })
  }

  return NextResponse.json({ commentId: data.id }, { status: 201 })
}
