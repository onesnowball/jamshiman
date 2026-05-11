import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient, canAdminUniversity } from '@/lib/server-auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', params.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = (post as { author_id: string }).author_id === viewer.id
  const isAdmin = viewer.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admins remove immediately; owners submit for approval
  const newStatus = isAdmin ? 'removed' : 'pending_delete'

  await (supabase as any)
    .from('posts')
    .update({ status: newStatus })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}

const EditSchema = z.object({
  title: z.string().min(4).max(120).trim(),
  body: z.string().min(10).max(5000).trim(),
})

const StatusSchema = z.object({
  status: z.enum(['active', 'archived', 'removed']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (viewer.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const body = await req.json()

  // Author editing their own post's content
  if ('title' in body || 'body' in body) {
    const parsed = EditSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg = Object.values(first).flat()[0] ?? 'Invalid input'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { data: post } = await supabase
      .from('posts')
      .select('author_id, status')
      .eq('id', params.id)
      .single()

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if ((post as { author_id: string }).author_id !== viewer.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!['active', 'flagged'].includes((post as { status: string }).status)) {
      return NextResponse.json({ error: 'Cannot edit a post that is pending deletion or removed.' }, { status: 409 })
    }

    await (supabase as any)
      .from('posts')
      .update({ title: parsed.data.title, body: parsed.data.body })
      .eq('id', params.id)

    return NextResponse.json({ ok: true })
  }

  // Admin status update
  const parsed = StatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const { data: post } = await supabase
    .from('posts')
    .select('university_id')
    .eq('id', params.id)
    .single()

  if (!post || !canAdminUniversity(viewer, (post as { university_id: string }).university_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await (supabase as any)
    .from('posts')
    .update({ status: parsed.data.status })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
