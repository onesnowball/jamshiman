import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { DEV_BYPASS_COOKIE, isDevBypassEnabled } from '@/lib/dev-bypass'

export async function POST(req: NextRequest) {
  if (!isDevBypassEnabled() || req.cookies.get(DEV_BYPASS_COOKIE)?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { flagId, contentType, contentId, action } = await req.json()

  if (!flagId || !contentType || !contentId || !action) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const { error: flagError } = await supabaseAny
    .from('flags')
    .update({ status: action === 'dismiss' ? 'dismissed' : 'resolved' })
    .eq('id', flagId)

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 500 })
  }

  if (action === 'remove') {
    const table = contentType === 'review' ? 'advisor_reviews'
      : contentType === 'course_review' ? 'course_reviews'
      : contentType === 'post' ? 'posts'
      : 'comments'

    const { error: contentError } = await supabaseAny
      .from(table)
      .update({ status: 'removed' })
      .eq('id', contentId)

    if (contentError) {
      return NextResponse.json({ error: contentError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
