import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireViewer } from '@/lib/server-auth'

const ScheduleSchema = z.object({
  name: z.string().min(3).max(80),
  semester: z.string().min(4).max(30),
})

const ScheduleDeleteSchema = z.object({
  schedule_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const body = await req.json()
  const parsed = ScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('schedules')
    .insert({
      user_id: viewer.id,
      name: parsed.data.name.trim(),
      semester: parsed.data.semester.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ schedule: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const body = await req.json()
  const parsed = ScheduleDeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('schedules')
    .delete()
    .eq('id', parsed.data.schedule_id)
    .eq('user_id', viewer.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
