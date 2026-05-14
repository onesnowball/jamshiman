// Aggregates activity signals for a single department.
// "Activity" = posts on the dept board, comments on those posts, course
// reviews on courses in the dept, and advisor reviews where the advisor's
// PRIMARY dept_id matches (secondary affiliations from
// advisor_department_affiliations are intentionally excluded — see
// PRODUCT_BACKLOG.md / dept activity signals spec).

import type { SupabaseClient } from '@supabase/supabase-js'
import { getDetroitWeekStart, getRecentDetroitWeekStarts } from '@/lib/pulse/date'

type Supa = SupabaseClient<any, 'public', any>

async function latestCreatedAt(
  promise: PromiseLike<{ data: { created_at: string }[] | null }>
): Promise<Date | null> {
  const { data } = await promise
  const ts = data?.[0]?.created_at
  return ts ? new Date(ts) : null
}

/** Most recent activity timestamp across posts/comments/reviews scoped to
 *  this department, or null if none. Treats `status='active'` as visible. */
export async function getLastDepartmentActivity(supabase: Supa, deptId: string): Promise<Date | null> {
  const supa = supabase as any

  const [latestPost, latestComment, latestCourseReview, latestAdvisorReview] = await Promise.all([
    latestCreatedAt(
      supa.from('posts')
        .select('created_at')
        .eq('dept_id', deptId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
    ),
    latestCreatedAt(
      supa.from('comments')
        .select('created_at, posts!inner(dept_id, status)')
        .eq('posts.dept_id', deptId)
        .eq('posts.status', 'active')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
    ),
    latestCreatedAt(
      supa.from('course_reviews')
        .select('created_at, courses!inner(dept_id)')
        .eq('courses.dept_id', deptId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
    ),
    latestCreatedAt(
      supa.from('advisor_reviews')
        .select('created_at, advisors!inner(dept_id)')
        .eq('advisors.dept_id', deptId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
    ),
  ])

  const candidates = [latestPost, latestComment, latestCourseReview, latestAdvisorReview]
    .filter((d): d is Date => d != null)
  if (!candidates.length) return null
  return candidates.reduce((a, b) => (a > b ? a : b))
}

export type WeeklyBucket = { week: string; count: number }

async function fetchRowsSince(
  promise: PromiseLike<{ data: { created_at: string }[] | null }>
): Promise<string[]> {
  const { data } = await promise
  return (data ?? []).map(r => r.created_at).filter(Boolean)
}

/** Counts per Detroit-week (12 weeks, oldest first) of every visible item
 *  attributable to this department: posts on the dept board, comments on
 *  those posts, course reviews on courses in the dept, and advisor reviews
 *  where the advisor's primary dept_id matches.
 *
 *  A post with 5 comments contributes 6 to that week's bucket (1 post + 5
 *  comments), per spec. */
export async function getDepartmentWeeklyActivity(
  supabase: Supa,
  deptId: string,
): Promise<WeeklyBucket[]> {
  const supa = supabase as any
  const weeks = getRecentDetroitWeekStarts(12)
  // Lower bound: 12 weeks back in UTC. Detroit week boundary may shift this
  // by a few hours but the bucketing step drops anything outside our 12 weeks.
  const since = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString()

  const [postRows, commentRows, courseReviewRows, advisorReviewRows] = await Promise.all([
    fetchRowsSince(
      supa.from('posts')
        .select('created_at')
        .eq('dept_id', deptId)
        .eq('status', 'active')
        .gte('created_at', since)
    ),
    fetchRowsSince(
      supa.from('comments')
        .select('created_at, posts!inner(dept_id, status)')
        .eq('posts.dept_id', deptId)
        .eq('posts.status', 'active')
        .eq('status', 'active')
        .gte('created_at', since)
    ),
    fetchRowsSince(
      supa.from('course_reviews')
        .select('created_at, courses!inner(dept_id)')
        .eq('courses.dept_id', deptId)
        .eq('status', 'active')
        .gte('created_at', since)
    ),
    fetchRowsSince(
      supa.from('advisor_reviews')
        .select('created_at, advisors!inner(dept_id)')
        .eq('advisors.dept_id', deptId)
        .eq('status', 'active')
        .gte('created_at', since)
    ),
  ])

  const counts = new Map<string, number>(weeks.map(w => [w, 0]))
  for (const ts of [...postRows, ...commentRows, ...courseReviewRows, ...advisorReviewRows]) {
    const wk = getDetroitWeekStart(new Date(ts))
    if (counts.has(wk)) counts.set(wk, (counts.get(wk) ?? 0) + 1)
  }
  return weeks.map(w => ({ week: w, count: counts.get(w) ?? 0 }))
}
