import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'

const CreateSchema = z.object({
  target_user_id: z.string().uuid(),
  reason: z.string().min(10).max(1000),
})

const ReviewSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
})

/** Campus admin (or global) submits a suspension request. */
export async function POST(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = CreateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const supabase = createAdminClient()

  // Verify target user is in a university this admin manages
  const { data: target } = await supabase
    .from('users')
    .select('university_id, role, is_banned')
    .eq('id', parsed.data.target_user_id)
    .single()

  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (!canAdminUniversity(viewer, (target as any).university_id)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }
  if ((target as any).role === 'admin') {
    return NextResponse.json({ error: 'Cannot suspend an admin account.' }, { status: 400 })
  }
  if ((target as any).is_banned) {
    return NextResponse.json({ error: 'User is already suspended.' }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('suspension_requests')
    .insert({
      target_user_id: parsed.data.target_user_id,
      requested_by: viewer.id,
      university_id: (target as any).university_id,
      reason: parsed.data.reason.trim(),
    })

  if (error) {
    // Unique index — pending request already exists
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A suspension request is already pending for this user.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

/** Global admin approves or denies a pending request. */
export async function PATCH(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer || viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Only global admins can review suspension requests.' }, { status: 403 })
  }

  const parsed = ReviewSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const supabase = createAdminClient()

  // Fetch the request
  const { data: requestRow } = await (supabase as any)
    .from('suspension_requests')
    .select('*')
    .eq('id', parsed.data.request_id)
    .eq('status', 'pending')
    .single()

  if (!requestRow) return NextResponse.json({ error: 'Request not found or already reviewed.' }, { status: 404 })

  // Mark request as approved/denied
  await (supabase as any)
    .from('suspension_requests')
    .update({
      status: parsed.data.action === 'approve' ? 'approved' : 'denied',
      reviewed_by: viewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.request_id)

  // If approved, actually ban the user
  if (parsed.data.action === 'approve') {
    await (supabase as any)
      .from('users')
      .update({ is_banned: true })
      .eq('id', requestRow.target_user_id)

    await supabase.auth.admin.updateUserById(requestRow.target_user_id, {
      ban_duration: '87600h',
    })

    await (supabase as any).from('audit_log').insert({
      admin_id: viewer.id,
      action: 'ban_user',
      target_type: 'user',
      target_id: requestRow.target_user_id,
      metadata: { via: 'suspension_request', request_id: parsed.data.request_id },
    })
  }

  return NextResponse.json({ ok: true })
}

/** List pending suspension requests for the current admin's university. */
export async function GET(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const universityId = req.nextUrl.searchParams.get('university_id')
  if (!universityId || !canAdminUniversity(viewer, universityId)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('suspension_requests')
    .select('*')
    .eq('university_id', universityId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return NextResponse.json({ requests: data ?? [] })
}
