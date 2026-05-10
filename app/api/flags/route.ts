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

  const payload: Database['public']['Tables']['flags']['Insert'] = {
    reporter_id: viewer.id,
    content_type: parsed.data.content_type,
    content_id: parsed.data.content_id,
    reason: parsed.data.reason,
    notes: parsed.data.notes?.trim() || null,
  }
  const supabaseAny = supabase as any

  const { error } = await supabaseAny.from('flags').insert(payload)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
