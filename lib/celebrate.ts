// Lightweight, navigation-survivable celebration queue.
// Forms call queueCelebration() before router.push(). On the next page mount,
// CelebrationListener consumes the flag and shows confetti + toast.

const KEY = 'jamshiman:celebrate'

export type CelebrationKind =
  | 'post_created'
  | 'advisor_review_submitted'
  | 'course_review_submitted'
  | 'checkin_submitted'
  | 'request_review_clicked'
  | 'onboarding_completed'

const MESSAGES: Record<CelebrationKind, string> = {
  post_created:              'Post live ✨ The campus feels slightly less alone 🫧',
  advisor_review_submitted:  'You helped future students make a better decision ✨',
  course_review_submitted:   'Course review live — tiny contribution, huge future-student energy 🌱',
  checkin_submitted:         'Check-in saved. jamshiman knows you a little better today 🌙',
  request_review_clicked:    'Request added ✨ We\'ll show future students that people want more info here.',
  onboarding_completed:      'Welcome aboard ✨ Your tiny grad survival corner is unlocked.',
}

export function queueCelebration(kind: CelebrationKind) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ kind, at: Date.now() }))
  } catch {}
}

export function consumeQueuedCelebration(): { kind: CelebrationKind; message: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(KEY)
    const parsed = JSON.parse(raw) as { kind: CelebrationKind; at: number }
    if (!parsed.kind || !MESSAGES[parsed.kind]) return null
    if (Date.now() - (parsed.at ?? 0) > 30_000) return null
    return { kind: parsed.kind, message: MESSAGES[parsed.kind] }
  } catch {
    return null
  }
}
