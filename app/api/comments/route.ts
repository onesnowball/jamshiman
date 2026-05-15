import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireViewer } from '@/lib/server-auth'

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(3).max(3000),
  is_anonymous: z.boolean(),
})

export async function POST(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const body = await req.json()
  const parsed = CommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // L-7: Verify the post belongs to the same university as the commenter.
  const { data: post } = await supabase
    .from('posts')
    .select('university_id')
    .eq('id', parsed.data.post_id)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  if ((post as { university_id: string }).university_id !== viewer.university_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
