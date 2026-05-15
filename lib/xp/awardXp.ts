import { createAdminClient } from '@/lib/supabase/server'

export type XpEventType =
  | 'onboarding_completed'
  | 'daily_checkin'
  | 'advisor_review_submitted'
  | 'course_review_submitted'
  | 'board_post_created'
  | 'helpful_vote_received'
  | 'request_review_clicked'

export const XP_POINTS: Record<XpEventType, number> = {
  onboarding_completed: 25,
  daily_checkin: 5,
  advisor_review_submitted: 40,
  course_review_submitted: 30,
  board_post_created: 10,
  helpful_vote_received: 5,
  request_review_clicked: 1,
}

/** Idempotent XP award. Safe to call multiple times with the same key. */
export async function awardXp(opts: {
  userId: string
  universityId: string
  eventType: XpEventType
  points?: number
  sourceType?: string | null
  sourceId?: string | null
  idempotencyKey: string
}): Promise<{ awarded: boolean }> {
  // `as any` on the client is needed because @supabase/ssr's typed Insert
  // resolves the table to never[] for our Database shape — a known quirk
  // we live with elsewhere in the codebase.
  const supabase = createAdminClient() as any
  const points = opts.points ?? XP_POINTS[opts.eventType]
  const { error } = await supabase.from('user_xp_ledger').insert({
    user_id: opts.userId,
    university_id: opts.universityId,
    event_type: opts.eventType,
    points,
    source_type: opts.sourceType ?? null,
    source_id: opts.sourceId ?? null,
    idempotency_key: opts.idempotencyKey,
  })
  if (error) {
    if (error.code === '23505') return { awarded: false }
    // swallow other errors to avoid breaking the parent action
    return { awarded: false }
  }
  return { awarded: true }
}

export async function getUserXpTotal(userId: string): Promise<number> {
  const supabase = createAdminClient() as any
  const { data } = await supabase
    .from('user_xp_ledger')
    .select('points')
    .eq('user_id', userId)
  return ((data ?? []) as { points: number }[]).reduce((sum, r) => sum + r.points, 0)
}
