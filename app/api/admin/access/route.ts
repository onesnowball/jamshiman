import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'

const AccessSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['student', 'admin']),
})

export async function POST(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = AccessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.user_id === viewer.id && parsed.data.role !== 'admin') {
    return NextResponse.json({ error: 'You cannot remove your own admin access here.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('users')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: 'update_user_role',
    target_type: 'user',
    target_id: parsed.data.user_id,
    metadata: { role: parsed.data.role },
  })

  return NextResponse.json({ ok: true })
}
