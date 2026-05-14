// Aggregates activity signals for a single department.
// "Activity" = posts on the dept board, comments on those posts, course
// reviews on courses in the dept, and advisor reviews where the advisor's
// PRIMARY dept_id matches (secondary affiliations from
// advisor_department_affiliations are intentionally excluded — see
// PRODUCT_BACKLOG.md / dept activity signals spec).

import type { SupabaseClient } from '@supabase/supabase-js'

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
