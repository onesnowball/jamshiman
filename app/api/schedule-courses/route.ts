import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

const BaseScheduleCourseSchema = z.object({
  schedule_id: z.string().uuid(),
  course_id: z.string().uuid(),
  day_of_week: z.number().int().min(1).max(5),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().max(120).nullable().optional(),
})

const UpdateScheduleCourseSchema = BaseScheduleCourseSchema.extend({
  schedule_course_id: z.string().uuid(),
})

const DeleteScheduleCourseSchema = z.object({
  schedule_course_id: z.string().uuid(),
})

async function scheduleBelongsToViewer(supabase: any, scheduleId: string, viewerId: string) {
  const { data } = await supabase
    .from('schedules')
    .select('id')
    .eq('id', scheduleId)
    .eq('user_id', viewerId)
    .single()

  return !!data
}

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = BaseScheduleCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  if (!(await scheduleBelongsToViewer(supabaseAny, parsed.data.schedule_id, viewer.id))) {
    return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 })
  }

  const { data, error } = await supabaseAny
    .from('schedule_courses')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scheduleCourse: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = UpdateScheduleCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  if (!(await scheduleBelongsToViewer(supabaseAny, parsed.data.schedule_id, viewer.id))) {
    return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 })
  }

  const { error } = await supabaseAny
    .from('schedule_courses')
    .update({
      course_id: parsed.data.course_id,
      day_of_week: parsed.data.day_of_week,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      location: parsed.data.location ?? null,
    })
    .eq('id', parsed.data.schedule_course_id)
    .eq('schedule_id', parsed.data.schedule_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = DeleteScheduleCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  const { data: scheduleCourse } = await supabaseAny
    .from('schedule_courses')
    .select('id, schedule_id')
    .eq('id', parsed.data.schedule_course_id)
    .single()

  if (!scheduleCourse) {
    return NextResponse.json({ error: 'Schedule block not found.' }, { status: 404 })
  }

  if (!(await scheduleBelongsToViewer(supabaseAny, scheduleCourse.schedule_id, viewer.id))) {
    return NextResponse.json({ error: 'Schedule not found.' }, { status: 404 })
  }

  const { error } = await supabaseAny
    .from('schedule_courses')
    .delete()
    .eq('id', parsed.data.schedule_course_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
