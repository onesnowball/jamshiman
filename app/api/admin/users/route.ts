import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'

const BanSchema = z.object({
  user_id: z.string().uuid(),
  is_banned: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = BanSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const supabase = createAdminClient()

  // Verify the target user belongs to a university this admin controls.
  const { data: targetUser } = await supabase
    .from('users')
    .select('university_id, role')
    .eq('id', parsed.data.user_id)
    .single()

  if (!targetUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  if (!canAdminUniversity(viewer, (targetUser as { university_id: string }).university_id)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  // Prevent banning another admin.
  if ((targetUser as { role: string }).role === 'admin') {
    return NextResponse.json({ error: 'Cannot ban an admin account.' }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('users')
    .update({ is_banned: parsed.data.is_banned })
    .eq('id', parsed.data.user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await (supabase as any).from('audit_log').insert({
    admin_id: viewer.id,
    action: parsed.data.is_banned ? 'ban_user' : 'unban_user',
    target_type: 'user',
    target_id: parsed.data.user_id,
    metadata: {},
  })

  return NextResponse.json({ ok: true })
}
