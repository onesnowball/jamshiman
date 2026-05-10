import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
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
  const flagUpdate = {
    status: parsed.data.action === 'dismiss' ? 'dismissed' : 'resolved',
    resolved_by: viewer.id,
  }
  const supabaseAny = supabase as any

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
