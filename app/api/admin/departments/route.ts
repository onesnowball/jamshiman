import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient, canAdminUniversity } from '@/lib/server-auth'

const CreateSchema = z.object({
  university_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
})

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  active: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = CreateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  if (!canAdminUniversity(viewer, parsed.data.university_id)) {
    return NextResponse.json({ error: 'Forbidden for this university.' }, { status: 403 })
  }

  const { data, error } = await (supabase as any)
    .from('departments')
    .insert({ ...parsed.data, active: true })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ department: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = UpdateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  // Verify ownership
  const { data: dept } = await (supabase as any)
    .from('departments').select('university_id').eq('id', parsed.data.id).single()
  if (!dept || !canAdminUniversity(viewer, dept.university_id)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const { id, ...updates } = parsed.data
  await (supabase as any).from('departments').update(updates).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  const { data: dept } = await (supabase as any)
    .from('departments').select('university_id').eq('id', id).single()
  if (!dept || !canAdminUniversity(viewer, dept.university_id)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  await (supabase as any).from('departments').update({ active: false }).eq('id', id)
  return NextResponse.json({ ok: true })
}
