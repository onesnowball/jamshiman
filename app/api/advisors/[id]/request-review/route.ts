import { NextRequest, NextResponse } from 'next/server'
import { getActionClient } from '@/lib/server-auth'
import { isOnboarded } from '@/lib/onboarding'
import { awardXp } from '@/lib/xp/awardXp'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (viewer.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  if (!isOnboarded(viewer as any)) return NextResponse.json({ error: 'Onboarding required' }, { status: 403 })

  const supa = supabase as any

  const { data: advisor } = await supa
    .from('advisors')
    .select('id, university_id, active')
    .eq('id', params.id)
    .single()

  if (!advisor || advisor.active === false) {
    return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
  }
  if (advisor.university_id !== viewer.university_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supa.from('advisor_review_requests').insert({
    user_id: viewer.id,
    advisor_id: params.id,
    university_id: viewer.university_id,
  })

  let alreadyRequested = false
  if (error) {
    if (error.code === '23505') {
      alreadyRequested = true
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // XP idempotent per (user, advisor)
  await awardXp({
    userId: viewer.id,
    universityId: viewer.university_id,
    eventType: 'request_review_clicked',
    sourceType: 'advisor',
    sourceId: params.id,
    idempotencyKey: `request_review_clicked:${viewer.id}:${params.id}`,
  })

  const { count } = await supa
    .from('advisor_review_requests')
    .select('*', { count: 'exact', head: true })
    .eq('advisor_id', params.id)

  return NextResponse.json({ ok: true, alreadyRequested, count: count ?? 0 })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supa = supabase as any
  const [{ count }, { data: mine }] = await Promise.all([
    supa.from('advisor_review_requests').select('*', { count: 'exact', head: true }).eq('advisor_id', params.id),
    supa.from('advisor_review_requests').select('id').eq('advisor_id', params.id).eq('user_id', viewer.id).maybeSingle(),
  ])
  return NextResponse.json({ count: count ?? 0, requested: !!mine })
}
