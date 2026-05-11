import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'

const AppealSchema = z.object({
  reason: z.string().min(10).max(2000),
})

/** Suspended user submits an appeal. */
export async function POST(req: NextRequest) {
  const viewer = await getOptionalViewer()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!viewer.is_banned) return NextResponse.json({ error: 'Your account is not suspended.' }, { status: 400 })

  const parsed = AppealSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Please write at least 10 characters.' }, { status: 400 })

  const supabase = createAdminClient()

  const { error } = await (supabase as any)
    .from('suspension_appeals')
    .insert({ user_id: viewer.id, reason: parsed.data.reason.trim() })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already have a pending appeal. Please wait for a review.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
