import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'
import type { Database } from '@/types/database'

const FlagSchema = z.object({
  content_type: z.enum(['review', 'course_review', 'post', 'comment']),
  content_id: z.string().uuid(),
  reason: z.enum(['inappropriate', 'inaccurate', 'spam', 'harmful', 'other']),
  notes: z.string().max(600).optional().or(z.literal('')),
})

const UnflagSchema = z.object({
  content_type: z.enum(['review', 'course_review', 'post', 'comment']),
  content_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'You need to sign in to report content.' }, { status: 401 })
  }

  if (viewer.is_banned) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = FlagSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const isAdmin = viewer.role === 'admin' || viewer.campusAdminUniversityIds.length > 0
  const supabaseAny = supabase as any

  if (isAdmin) {
    // Admins can flag unlimited times — upsert resets any existing flag back to pending.
    const { error } = await supabaseAny
      .from('flags')
      .upsert(
        {
          reporter_id: viewer.id,
          content_type: parsed.data.content_type,
          content_id: parsed.data.content_id,
          reason: parsed.data.reason,
          notes: parsed.data.notes?.trim() || null,
          status: 'pending',
        },
        { onConflict: 'reporter_id,content_type,content_id' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  // Regular users: once per content item (unique constraint enforced at DB level)
  const payload: Database['public']['Tables']['flags']['Insert'] = {
    reporter_id: viewer.id,
    content_type: parsed.data.content_type,
    content_id: parsed.data.content_id,
    reason: parsed.data.reason,
    notes: parsed.data.notes?.trim() || null,
  }

  const { error } = await supabaseAny.from('flags').insert(payload)

  if (error) {
    // Unique constraint violation — already reported.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already_reported: true }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

/** DELETE — lets a user retract their own flag (undo report). */
export async function DELETE(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = UnflagSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Only delete the viewer's own pending flag — resolved/dismissed flags stay for the audit trail.
  const { error } = await (supabase as any)
    .from('flags')
    .delete()
    .eq('reporter_id', viewer.id)
    .eq('content_type', parsed.data.content_type)
    .eq('content_id', parsed.data.content_id)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** GET — check whether the current viewer has already flagged a piece of content. */
export async function GET(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ reported: false })
  }

  const { searchParams } = new URL(req.url)
  const content_type = searchParams.get('content_type')
  const content_id = searchParams.get('content_id')

  if (!content_type || !content_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const { data } = await (supabase as any)
    .from('flags')
    .select('id, status')
    .eq('reporter_id', viewer.id)
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .maybeSingle()

  return NextResponse.json({
    reported: !!data,
    // Only show undo option while the flag is still pending (not yet actioned by admin).
    canUndo: data?.status === 'pending',
  })
}
