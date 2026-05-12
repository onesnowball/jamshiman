import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'

const AdvisorSchema = z.object({
  dept_id: z.string().uuid(),
  name: z.string().min(3).max(120),
  title: z.string().max(120).optional().or(z.literal('')),
  lab_name: z.string().max(160).optional().or(z.literal('')),
  research_areas: z.array(z.string().min(1).max(60)).max(12),
  active: z.boolean().optional().default(true),
})

const AdvisorUpdateSchema = AdvisorSchema.extend({
  id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = AdvisorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  // Academic dept only (not board topics). Inactive departments are allowed so
  // admins can attach advisors before turning a department "visible".
  const { data: department } = await supabase
    .from('departments')
    .select('id, university_id')
    .eq('id', parsed.data.dept_id)
    .eq('is_board_category', false)
    .single()

  if (!department) {
    return NextResponse.json({ error: 'Academic department not found.' }, { status: 404 })
  }

  if (!canAdminUniversity(viewer, (department as { university_id: string }).university_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAny
    .from('advisors')
    .insert({
      university_id: (department as { university_id: string }).university_id,
      dept_id: parsed.data.dept_id,
      name: parsed.data.name.trim(),
      title: parsed.data.title?.trim() || null,
      lab_name: parsed.data.lab_name?.trim() || null,
      research_areas: parsed.data.research_areas,
      active: parsed.data.active,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: 'create_advisor',
    target_type: 'advisor',
    target_id: data.id,
    metadata: { dept_id: parsed.data.dept_id },
  })

  return NextResponse.json({ advisor: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = AdvisorUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const { data: existingAdvisor } = await supabase
    .from('advisors')
    .select('university_id')
    .eq('id', parsed.data.id)
    .single()

  if (!existingAdvisor) {
    return NextResponse.json({ error: 'Advisor not found.' }, { status: 404 })
  }

  if (!canAdminUniversity(viewer, (existingAdvisor as { university_id: string }).university_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: department } = await supabase
    .from('departments')
    .select('id, university_id')
    .eq('id', parsed.data.dept_id)
    .eq('is_board_category', false)
    .single()

  if (!department) {
    return NextResponse.json({ error: 'Academic department not found.' }, { status: 404 })
  }

  if (!canAdminUniversity(viewer, (department as { university_id: string }).university_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAny
    .from('advisors')
    .update({
      university_id: (department as { university_id: string }).university_id,
      dept_id: parsed.data.dept_id,
      name: parsed.data.name.trim(),
      title: parsed.data.title?.trim() || null,
      lab_name: parsed.data.lab_name?.trim() || null,
      research_areas: parsed.data.research_areas,
      active: parsed.data.active,
    })
    .eq('id', parsed.data.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: 'update_advisor',
    target_type: 'advisor',
    target_id: parsed.data.id,
    metadata: { dept_id: parsed.data.dept_id, active: parsed.data.active },
  })

  return NextResponse.json({ ok: true })
}
