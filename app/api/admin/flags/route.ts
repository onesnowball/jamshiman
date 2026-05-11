import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'
import { getContentTable } from '@/lib/content'

const FlagActionSchema = z.object({
  contentType: z.enum(['review', 'course_review', 'post', 'comment']),
  contentId: z.string().uuid(),
  action: z.enum(['dismiss', 'remove']),
})

export async function POST(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = FlagActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  // H-3: Verify content belongs to a university this admin controls.
  if (viewer.role !== 'admin') {
    let contentUniversityId: string | null = null
    if (parsed.data.contentType === 'post') {
      const { data } = await supabase.from('posts').select('university_id').eq('id', parsed.data.contentId).single()
      contentUniversityId = (data as { university_id: string } | null)?.university_id ?? null
    } else if (parsed.data.contentType === 'comment') {
      const { data: comment } = await supabase.from('comments').select('post_id').eq('id', parsed.data.contentId).single()
      if (comment) {
        const { data: post } = await supabase.from('posts').select('university_id').eq('id', (comment as { post_id: string }).post_id).single()
        contentUniversityId = (post as { university_id: string } | null)?.university_id ?? null
      }
    } else if (parsed.data.contentType === 'review') {
      const { data: review } = await supabase.from('advisor_reviews').select('advisor_id').eq('id', parsed.data.contentId).single()
      if (review) {
        const { data: advisor } = await supabase.from('advisors').select('university_id').eq('id', (review as { advisor_id: string }).advisor_id).single()
        contentUniversityId = (advisor as { university_id: string } | null)?.university_id ?? null
      }
    }
    if (!contentUniversityId || !canAdminUniversity(viewer, contentUniversityId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Resolve ALL pending flags for this content in one action.
  // Multiple reporters → one admin decision clears them all.
  const newFlagStatus = parsed.data.action === 'dismiss' ? 'dismissed' : 'resolved'
  const { error: flagError } = await supabaseAny
    .from('flags')
    .update({ status: newFlagStatus, resolved_by: viewer.id })
    .eq('content_id', parsed.data.contentId)
    .eq('content_type', parsed.data.contentType)
    .eq('status', 'pending')

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 500 })
  }

  if (parsed.data.action === 'remove') {
    const table = getContentTable(parsed.data.contentType)
    const { error: contentError } = await supabaseAny
      .from(table)
      .update({ status: 'removed' })
      .eq('id', parsed.data.contentId)

    if (contentError) {
      return NextResponse.json({ error: contentError.message }, { status: 500 })
    }
  }

  await supabaseAny.from('audit_log').insert({
    admin_id: viewer.id,
    action: parsed.data.action === 'dismiss' ? 'dismiss_flag' : 'remove_flagged_content',
    target_type: parsed.data.contentType,
    target_id: parsed.data.contentId,
    metadata: {},
  })

  return NextResponse.json({ ok: true })
}
