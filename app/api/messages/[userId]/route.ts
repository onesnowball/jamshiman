import { NextRequest, NextResponse } from 'next/server'
import { getActionClient } from '@/lib/server-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabase as any
  const { data } = await db
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${viewer.id},recipient_id.eq.${params.userId}),and(sender_id.eq.${params.userId},recipient_id.eq.${viewer.id})`
    )
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark incoming messages as read
  await db
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', viewer.id)
    .eq('sender_id', params.userId)
    .is('read_at', null)

  return NextResponse.json({ messages: data ?? [] })
}
