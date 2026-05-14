import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'
import { ACADEMIC_STATUSES } from '@/lib/pulse/options'
import { awardXp } from '@/lib/xp/awardXp'

const Body = z.object({
  handle: z
    .string()
    .min(3).max(20)
    .regex(/^[a-z0-9_]+$/, 'Handle can only contain lowercase letters, numbers, and underscores')
    .transform(s => s.toLowerCase()),
  academicStatus: z.enum(ACADEMIC_STATUSES),
  deptId: z.string().uuid(),
  gradAttestation: z.literal(true),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (viewer.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const body = await req.json()
  const parsed = Body.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify department belongs to viewer's university and is active.
  const { data: dept } = await (supabase as any)
    .from('departments')
    .select('id, university_id, active, is_board_category')
    .eq('id', parsed.data.deptId)
    .single()

  if (!dept || dept.university_id !== viewer.university_id || dept.active === false || dept.is_board_category === true) {
    return NextResponse.json({ error: 'Invalid department' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error } = await (supabase as any)
    .from('users')
    .update({
      handle: parsed.data.handle,
      academic_status: parsed.data.academicStatus,
      dept_id: parsed.data.deptId,
      onboarding_completed: true,
      onboarding_completed_at: now,
      grad_attested_at: now,
    })
    .eq('id', viewer.id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That handle is already taken — try another' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await awardXp({
    userId: viewer.id,
    universityId: viewer.university_id,
    eventType: 'onboarding_completed',
    idempotencyKey: `onboarding_completed:${viewer.id}`,
  })

  return NextResponse.json({ ok: true })
}
