import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

async function getComment(commentId: string, supabase: any) {
  const { data } = await supabase
    .from('comments')
    .select('id, author_id')
    .eq('id', commentId)
    .single()
  return data as { id: string; author_id: string } | null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const comment = await getComment(params.id, supabase as any)
  const isOwner = comment?.author_id === viewer.id
  const isAdmin = viewer.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })
  }

  // Admins remove immediately; owners submit for approval
  const newStatus = isAdmin ? 'removed' : 'pending_delete'

  await (supabase as any)
    .from('comments')
    .update({ status: newStatus })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}

const EditSchema = z.object({ body: z.string().min(3).max(3000) })

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Admin status update (archive/restore)
  if (viewer.role === 'admin' && 'status' in body) {
    const { status } = body as { status: string }
    if (!['active', 'archived', 'removed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    await (supabase as any).from('comments').update({ status }).eq('id', params.id)
    return NextResponse.json({ ok: true })
  }

  // Owner body edit
  const parsed = EditSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const comment = await getComment(params.id, supabase as any)
  if (comment?.author_id !== viewer.id) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })
  }

  await (supabase as any)
    .from('comments')
    .update({ body: parsed.data.body.trim() })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
