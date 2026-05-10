import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

async function getOwnedComment(commentId: string, viewerId: string, supabase: any) {
  const { data } = await supabase
    .from('comments')
    .select('id, author_id')
    .eq('id', commentId)
    .single()
  if (!data) return null
  if (data.author_id !== viewerId) return null
  return data
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const comment = await getOwnedComment(params.id, viewer.id, supabase as any)
  if (!comment && viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })
  }

  await (supabase as any)
    .from('comments')
    .update({ status: 'removed' })
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

  const parsed = EditSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const comment = await getOwnedComment(params.id, viewer.id, supabase as any)
  if (!comment) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })

  await (supabase as any)
    .from('comments')
    .update({ body: parsed.data.body.trim() })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
