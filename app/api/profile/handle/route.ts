import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

const HandleSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(20, 'Handle can be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Handle can only contain lowercase letters, numbers, and underscores')
    .transform(s => s.toLowerCase()),
})

export async function PATCH(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (viewer.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const body = await req.json()
  const parsed = HandleSchema.safeParse(body)
  if (!parsed.success) {
    const firstError =
      parsed.error.flatten().fieldErrors.handle?.[0] ?? 'Invalid handle'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('users')
    .update({ handle: parsed.data.handle })
    .eq('id', viewer.id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That handle is already taken — try another' }, { status: 409 })
    }
    if (error.code === '23514') {
      return NextResponse.json({ error: 'Handle can only contain lowercase letters, numbers, and underscores (3–20 chars)' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, handle: parsed.data.handle })
}
