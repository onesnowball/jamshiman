import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'

const ReviewSchema = z.object({
  appeal_id: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
})

/** Global admin: list pending appeals for a university. */
export async function GET(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer || viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const universityId = req.nextUrl.searchParams.get('university_id')
  if (!universityId) return NextResponse.json({ error: 'Missing university_id' }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('suspension_appeals')
    .select('*, users!user_id(university_id)')
    .eq('users.university_id', universityId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return NextResponse.json({ appeals: data ?? [] })
}

/** Global admin: approve (unban) or deny an appeal. */
export async function PATCH(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer || viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Only global admins can review appeals.' }, { status: 403 })
  }

  const parsed = ReviewSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: appeal } = await (supabase as any)
    .from('suspension_appeals')
    .select('*')
    .eq('id', parsed.data.appeal_id)
    .eq('status', 'pending')
    .single()

  if (!appeal) return NextResponse.json({ error: 'Appeal not found or already reviewed.' }, { status: 404 })

  await (supabase as any)
    .from('suspension_appeals')
    .update({
      status: parsed.data.action === 'approve' ? 'approved' : 'denied',
      reviewed_by: viewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.appeal_id)

  if (parsed.data.action === 'approve') {
    // Unban both in our DB and Supabase Auth
    await (supabase as any)
      .from('users')
      .update({ is_banned: false })
      .eq('id', appeal.user_id)

    await supabase.auth.admin.updateUserById(appeal.user_id, {
      ban_duration: 'none',
    })

    await (supabase as any).from('audit_log').insert({
      admin_id: viewer.id,
      action: 'unban_user',
      target_type: 'user',
      target_id: appeal.user_id,
      metadata: { via: 'appeal', appeal_id: parsed.data.appeal_id },
    })
  }

  return NextResponse.json({ ok: true })
}
