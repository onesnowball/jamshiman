import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireViewer } from '@/lib/server-auth'

const UUIDSchema = z.string().uuid()

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // M-1: Validate that userId is a properly formatted UUID before using it in queries.
  if (!UUIDSchema.safeParse(params.userId).success) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 })
  }

  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

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
