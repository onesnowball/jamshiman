import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, NotebookPen, UserCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { ProfileActivity } from '@/components/profile/ProfileActivity'
import { HandleEditor } from '@/components/profile/HandleEditor'
import { SignOutButton } from '@/components/profile/SignOutButton'
import { DeleteAccountRow } from '@/components/profile/DeleteAccountRow'
import type { AdvisorReview, CourseReview, Post, Comment, Schedule } from '@/types/database'
import { isOnboarded } from '@/lib/onboarding'

type ProfileAdvisorReview = AdvisorReview & {
  advisors: { id: string; name: string | null } | null
}

type ProfileCourseReview = CourseReview & {
  courses: { id: string; code: string | null; name: string | null } | null
}

type ProfilePost = Post & {
  departments: { slug: string | null; name: string | null } | null
  universities: { domain: string | null } | null
}

type ProfileComment = Comment & {
  posts: { id: string | null; title: string | null } | null
}

type ProfileSchedule = Schedule & {
  schedule_courses: Array<{ id: string }>
}

function statusBadgeClass(status: string) {
  if (status === 'active') return 'badge-green'
  if (status === 'removed') return 'badge-red'
  return 'badge-amber'
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof UserCircle2
  title: string
  body: string
}) {
  return (
    <div className="card p-8 text-center text-gray-400">
      <Icon className="w-8 h-8 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-xs mt-1">{body}</p>
    </div>
  )
}

export default async function ProfilePage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')
  if (!isOnboarded(viewer as any)) redirect('/profile/onboarding')

  const supabase = createAdminClient()

  const [
    { data: advisorReviewsData },
    { data: courseReviewsData },
    { data: postsData },
    { data: commentsData },
    { data: schedulesData },
  ] = await Promise.all([
    supabase
      .from('advisor_reviews')
      .select('*, advisors(id, name)')
      .eq('reviewer_id', viewer.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('course_reviews')
      .select('*, courses(id, code, name)')
      .eq('reviewer_id', viewer.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select('*, departments(slug, name), universities(domain)')
      .eq('author_id', viewer.id)
      .in('status', ['active', 'pending_delete'])
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select('*, posts(id, title)')
      .eq('author_id', viewer.id)
      .in('status', ['active', 'pending_delete'])
      .order('created_at', { ascending: false }),
    supabase
      .from('schedules')
      .select('*, schedule_courses(id)')
      .eq('user_id', viewer.id)
      .order('created_at', { ascending: false }),
  ])

  const [{ data: xpRecentData }, { data: xpAllData }] = await Promise.all([
    supabase
      .from('user_xp_ledger' as any)
      .select('event_type, points, created_at')
      .eq('user_id', viewer.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('user_xp_ledger' as any)
      .select('points')
      .eq('user_id', viewer.id),
  ])
  const xpRows = (xpRecentData ?? []) as { event_type: string; points: number; created_at: string }[]
  const xpTotal = ((xpAllData ?? []) as { points: number }[]).reduce((s, r) => s + r.points, 0)

  const advisorReviews = (advisorReviewsData ?? []) as ProfileAdvisorReview[]
  const courseReviews = (courseReviewsData ?? []) as ProfileCourseReview[]
  const posts = (postsData ?? []) as ProfilePost[]
  const comments = (commentsData ?? []) as ProfileComment[]
  const schedules = (schedulesData ?? []) as ProfileSchedule[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter space-y-6">
        <section className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-lg">
              {viewer.handle ? viewer.handle.slice(0, 2).toUpperCase() : (viewer.email?.slice(0, 2).toUpperCase() ?? '??')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Your profile</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Verified via {viewer.email}. This page stays private to you.
                  </p>
                </div>
                <SignOutButton />
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="badge-blue">{viewer.role === 'admin' ? 'Admin' : 'Student'}</span>
                {viewer.degree_type && <span className="badge-gray">{viewer.degree_type.toUpperCase()}</span>}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-200">{xpTotal} Campus XP ✨</span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Display name</p>
                <HandleEditor currentHandle={viewer.handle ?? null} />
                <p className="text-xs text-gray-400 mt-1.5">
                  Shown when you post without anonymity. Can be changed anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-medium text-gray-900 mb-3">Recent Campus XP ✨</h2>
          {!xpRows.length ? (
            <p className="text-xs text-gray-500">No XP yet. Check in or write a review to earn some.</p>
          ) : (
            <ul className="space-y-1.5">
              {xpRows.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{r.event_type.replace(/_/g, ' ')}</span>
                  <span className="text-gray-400">+{r.points} · {new Date(r.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-gray-500" />
            <h2 className="font-medium text-gray-900">Advisor reviews</h2>
          </div>
          {!advisorReviews.length ? (
            <EmptyState
              icon={NotebookPen}
              title="No advisor reviews yet"
              body="Your submitted advisor reviews will show up here."
            />
          ) : (
            advisorReviews.map(review => (
              <div key={review.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{review.advisors?.name ?? 'Advisor'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(review as any).is_lab_member != null
                        ? ((review as any).is_lab_member ? 'Lab member' : 'Non-lab student') + ' · '
                        : ''}{new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={statusBadgeClass(review.status)}>
                    {review.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{review.original_text}</p>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-gray-500" />
            <h2 className="font-medium text-gray-900">Course reviews</h2>
          </div>
          {!courseReviews.length ? (
            <EmptyState
              icon={NotebookPen}
              title="No course reviews yet"
              body="Your course reviews will appear here once you submit them."
            />
          ) : (
            courseReviews.map(review => (
              <div key={review.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {review.courses?.code} · {review.courses?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {review.semester} · {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={statusBadgeClass(review.status)}>
                    {review.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{review.original_text}</p>
              </div>
            ))
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="font-medium text-gray-900">Threads and comments</h2>
            <ProfileActivity initialPosts={posts as any} initialComments={comments as any} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <h2 className="font-medium text-gray-900">Saved schedules</h2>
            </div>

            {!schedules.length ? (
              <EmptyState
                icon={CalendarDays}
                title="No schedules yet"
                body="Once you create a private schedule, it will show up here."
              />
            ) : (
              schedules.map(schedule => (
                <div key={schedule.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{schedule.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{schedule.semester}</p>
                    </div>
                    <span className="badge-blue">
                      {schedule.schedule_courses.length} block{schedule.schedule_courses.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-2 pt-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Danger zone</h2>
          <DeleteAccountRow requestedAt={(viewer as any).delete_requested_at ?? null} />
        </section>
      </main>
    </div>
  )
}
