import { NextRequest, NextResponse } from 'next/server'
import { getActionClient } from '@/lib/server-auth'

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
  if (!isOwner && viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('posts')
    .update({ status: 'removed' } as any)
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
