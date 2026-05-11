import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'
import type { Database } from '@/types/database'

const ReviewSchema = z.object({
  advisor_id: z.string().uuid(),
  is_lab_member: z.boolean().nullable().optional(),
  ratings: z.object({
    mentorship: z.number().min(1).max(5),
    funding: z.number().min(1).max(5),
    worklife: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    career: z.number().min(1).max(5),
  }),
  original_text: z.string().min(50).max(3000),
  anonymized_text: z.string().min(20).max(3000).optional(),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const reviewPayload = {
    ...parsed.data,
    anonymized_text: parsed.data.anonymized_text ?? parsed.data.original_text,
  }

  // Check user isn't banned
  if (viewer.is_banned) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  // H-5: Verify the advisor belongs to the same university as the reviewer.
  const supabaseAny = supabase as any
  const { data: advisor } = await supabase
    .from('advisors')
    .select('university_id')
    .eq('id', parsed.data.advisor_id)
    .single()

  if (!advisor) {
    return NextResponse.json({ error: 'Advisor not found.' }, { status: 404 })
  }

  if ((advisor as { university_id: string }).university_id !== viewer.university_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload: Database['public']['Tables']['advisor_reviews']['Insert'] = {
    ...reviewPayload,
    degree_type: null,
    is_lab_member: parsed.data.is_lab_member ?? null,
    reviewer_id: viewer.id,
    status: 'active',
    years_in_lab: null,
    is_current: false,
  }

  const { data, error } = await supabaseAny
    .from('advisor_reviews')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You have already reviewed this advisor' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data }, { status: 201 })
}
