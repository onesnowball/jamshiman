import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'

async function syncAdvisorDepartmentAffiliations(
  supabaseAny: any,
  advisorId: string,
  primaryDeptId: string,
  additionalDeptIds: string[],
  universityId: string,
) {
  const unique = Array.from(new Set(additionalDeptIds)).filter(id => id && id !== primaryDeptId)
  const { error: delErr } = await supabaseAny.from('advisor_department_affiliations').delete().eq('advisor_id', advisorId)
  if (delErr) throw new Error(delErr.message)
  if (!unique.length) return

  const { data: deptRows, error: deptErr } = await supabaseAny
    .from('departments')
    .select('id, university_id, is_board_category')
    .in('id', unique)
  if (deptErr) throw new Error(deptErr.message)

  const dr = (deptRows ?? []) as { id: string; university_id: string; is_board_category: boolean }[]
  if (dr.length !== unique.length) {
    throw new Error('One or more additional departments were not found.')
  }
  for (const d of dr) {
    if (d.university_id !== universityId) {
      throw new Error('An additional department belongs to a different university.')
    }
    if (d.is_board_category) {
      throw new Error('Board topics cannot be used as academic departments.')
    }
  }

  const { error: insErr } = await supabaseAny.from('advisor_department_affiliations').insert(
    unique.map(dept_id => ({ advisor_id: advisorId, dept_id }))
  )
  if (insErr) throw new Error(insErr.message)
}

const AdvisorSchema = z.object({
  dept_id: z.string().uuid(),
  name: z.string().min(3).max(120),
  title: z.string().max(120).optional().or(z.literal('')),
  lab_name: z.string().max(160).optional().or(z.literal('')),
  research_areas: z.array(z.string().min(1).max(60)).max(12),
  active: z.boolean().optional().default(true),
  additional_dept_ids: z.array(z.string().uuid()).max(12).optional().default([]),
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

  try {
    await syncAdvisorDepartmentAffiliations(
      supabaseAny,
      data.id,
      parsed.data.dept_id,
      parsed.data.additional_dept_ids,
      (department as { university_id: string }).university_id,
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not save department affiliations.'
    return NextResponse.json({ error: msg }, { status: 400 })
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

  try {
    await syncAdvisorDepartmentAffiliations(
      supabaseAny,
      parsed.data.id,
      parsed.data.dept_id,
      parsed.data.additional_dept_ids,
      (department as { university_id: string }).university_id,
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not save department affiliations.'
    return NextResponse.json({ error: msg }, { status: 400 })
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
