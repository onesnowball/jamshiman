import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'

const CourseReviewSchema = z.object({
  course_id: z.string().uuid(),
  semester: z.string().min(4).max(30),
  degree_type: z.enum(['ms', 'phd']),
  ratings: z.object({
    difficulty: z.number().min(1).max(5),
    usefulness: z.number().min(1).max(5),
    workload: z.number().min(1).max(5),
    professor: z.number().min(1).max(5),
  }),
  original_text: z.string().min(1).max(3000),
})

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (viewer.is_banned) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CourseReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('course_reviews')
    .insert({
      ...parsed.data,
      anonymized_text: parsed.data.original_text,
      reviewer_id: viewer.id,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You have already reviewed this course.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data }, { status: 201 })
}
