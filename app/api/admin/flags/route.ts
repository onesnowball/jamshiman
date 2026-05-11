import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'
import { getContentTable } from '@/lib/content'
import type { Database } from '@/types/database'

const FlagActionSchema = z.object({
  flagId: z.string().uuid(),
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

  // H-3: Verify the content being actioned belongs to a university this admin controls.
  // Resolve university_id from the content (post → university_id directly; comment → via post).
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

  const flagUpdate = {
    status: parsed.data.action === 'dismiss' ? 'dismissed' : 'resolved',
    resolved_by: viewer.id,
  }

  const { error: flagError } = await supabaseAny
    .from('flags')
    .update(flagUpdate)
    .eq('id', parsed.data.flagId)

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 500 })
  }

  if (parsed.data.action === 'remove') {
    const table = getContentTable(parsed.data.contentType)
    const contentUpdate = { status: 'removed' }
    const { error: contentError } = await supabaseAny
      .from(table)
      .update(contentUpdate)
      .eq('id', parsed.data.contentId)

    if (contentError) {
      return NextResponse.json({ error: contentError.message }, { status: 500 })
    }
  }

  const auditEntry = {
    admin_id: viewer.id,
    action: parsed.data.action === 'dismiss' ? 'dismiss_flag' : 'remove_flagged_content',
    target_type: parsed.data.contentType,
    target_id: parsed.data.contentId,
    metadata: {
      flag_id: parsed.data.flagId,
    },
  }

  await supabaseAny.from('audit_log').insert(auditEntry)

  return NextResponse.json({ ok: true })
}
