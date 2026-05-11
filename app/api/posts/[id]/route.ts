import { NextRequest, NextResponse } from 'next/server'
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only global admins or campus admins managing this post's university may update status.
  const { data: post } = await supabase
    .from('posts')
    .select('university_id')
    .eq('id', params.id)
    .single()

  if (!post || !canAdminUniversity(viewer, (post as { university_id: string }).university_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { status } = body as { status: string }

  if (!['active', 'archived', 'removed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  await (supabase as any)
    .from('posts')
    .update({ status })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
