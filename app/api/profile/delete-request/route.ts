import { NextResponse } from 'next/server'
import { requireViewer } from '@/lib/server-auth'

/**
 * Marks the viewer's account for deletion (sets users.delete_requested_at).
 * No actual user-record removal happens here — that's a manual admin action
 * via the Supabase dashboard. This endpoint only records the request so
 * (a) users have a clear off-board path and (b) admins have a queue.
 */
export async function POST() {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const { error } = await (supabase as any)
    .from('users')
    .update({ delete_requested_at: new Date().toISOString() })
    .eq('id', viewer.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** Cancel a pending deletion request. */
export async function DELETE() {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const { error } = await (supabase as any)
    .from('users')
    .update({ delete_requested_at: null })
    .eq('id', viewer.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
