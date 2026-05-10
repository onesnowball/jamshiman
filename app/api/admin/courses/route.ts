import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'

const CourseSchema = z.object({
  dept_id: z.string().uuid(),
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(200),
  credits: z.number().int().min(1).max(12).nullable().optional(),
})

const CourseUpdateSchema = CourseSchema.extend({
  id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = CourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const { data: department } = await supabase
    .from('departments')
    .select('id, university_id')
    .eq('id', parsed.data.dept_id)
    .single()

  if (!department) {
    return NextResponse.json({ error: 'Department not found.' }, { status: 404 })
  }

  const { data, error } = await supabaseAny
    .from('courses')
    .insert({
      university_id: (department as { university_id: string }).university_id,
      dept_id: parsed.data.dept_id,
      code: parsed.data.code.trim().toUpperCase(),
      name: parsed.data.name.trim(),
      credits: parsed.data.credits ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A course with that code already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: 'create_course',
    target_type: 'course',
    target_id: data.id,
    metadata: { code: parsed.data.code, dept_id: parsed.data.dept_id },
  })

  return NextResponse.json({ course: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = CourseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const { data: department } = await supabase
    .from('departments')
    .select('id, university_id')
    .eq('id', parsed.data.dept_id)
    .single()

  if (!department) {
    return NextResponse.json({ error: 'Department not found.' }, { status: 404 })
  }

  const { error } = await supabaseAny
    .from('courses')
    .update({
      university_id: (department as { university_id: string }).university_id,
      dept_id: parsed.data.dept_id,
      code: parsed.data.code.trim().toUpperCase(),
      name: parsed.data.name.trim(),
      credits: parsed.data.credits ?? null,
    })
    .eq('id', parsed.data.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: 'update_course',
    target_type: 'course',
    target_id: parsed.data.id,
    metadata: { code: parsed.data.code },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing course id.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const { error } = await supabaseAny
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: 'delete_course',
    target_type: 'course',
    target_id: id,
    metadata: {},
  })

  return NextResponse.json({ ok: true })
}
