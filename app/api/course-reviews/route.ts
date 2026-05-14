import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'
import { awardXp } from '@/lib/xp/awardXp'

const CourseReviewSchema = z.object({
  course_id: z.string().uuid(),
  semester: z.string().min(4).max(30),
  degree_type: z.enum(['ms', 'phd']).optional().default('ms'),
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

  // H-6: Verify the course belongs to the same university as the reviewer.
  const { data: course } = await supabase
    .from('courses')
    .select('university_id')
    .eq('id', parsed.data.course_id)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
  }

  if ((course as { university_id: string }).university_id !== viewer.university_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  await awardXp({
    userId: viewer.id,
    universityId: viewer.university_id,
    eventType: 'course_review_submitted',
    sourceType: 'course_review',
    sourceId: (data as { id?: string } | null)?.id ?? null,
    idempotencyKey: `course_review_submitted:${(data as { id?: string } | null)?.id ?? `${viewer.id}:${parsed.data.course_id}:${parsed.data.semester}`}`,
  })

  return NextResponse.json({ review: data }, { status: 201 })
}
