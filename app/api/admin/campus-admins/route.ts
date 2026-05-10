import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

const Schema = z.object({
  user_id: z.string().uuid(),
  university_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer || viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const { error } = await (supabase as any)
    .from('campus_admins')
    .upsert({ user_id: parsed.data.user_id, university_id: parsed.data.university_id, granted_by: viewer.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer || viewer.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  await (supabase as any)
    .from('campus_admins')
    .delete()
    .eq('user_id', parsed.data.user_id)
    .eq('university_id', parsed.data.university_id)

  return NextResponse.json({ ok: true })
}
