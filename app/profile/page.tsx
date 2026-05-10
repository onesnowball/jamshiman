import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, MessageSquare, NotebookPen, UserCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import type { AdvisorReview, CourseReview, Post, Comment, Schedule } from '@/types/database'

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
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select('*, posts(id, title)')
      .eq('author_id', viewer.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('schedules')
      .select('*, schedule_courses(id)')
      .eq('user_id', viewer.id)
      .order('created_at', { ascending: false }),
  ])

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
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
              {viewer.email?.slice(0, 2).toUpperCase() ?? 'UM'}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Your profile</h1>
              <p className="text-sm text-gray-500 mt-1">
                Verified via {viewer.email}. This page stays private to you.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="badge-blue">{viewer.role === 'admin' ? 'Admin' : 'Student'}</span>
                {viewer.degree_type && <span className="badge-gray">{viewer.degree_type.toUpperCase()}</span>}
              </div>
            </div>
          </div>
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
                      {review.degree_type.toUpperCase()} · {new Date(review.created_at).toLocaleDateString()}
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
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <h2 className="font-medium text-gray-900">Threads and comments</h2>
            </div>

            {!posts.length && !comments.length ? (
              <EmptyState
                icon={MessageSquare}
                title="No board activity yet"
                body="Threads and comments you create will show up here."
              />
            ) : (
              <div className="space-y-3">
                {posts.map(post => {
                  const school = post.universities?.domain?.split('.')[0]
                  const href = school && post.departments?.slug
                    ? `/${school}/boards/${post.departments.slug}/${post.id}`
                    : '#'
                  return (
                  <Link
                    key={post.id}
                    href={href}
                    className="card p-4 block"
                  >
                    <p className="text-sm font-medium text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Thread · {post.departments?.name ?? 'Department'}
                    </p>
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">{post.body}</p>
                  </Link>
                  )
                })}

                {comments.map(comment => (
                  <div key={comment.id} className="card p-4">
                    <p className="text-sm font-medium text-gray-900">{comment.posts?.title ?? 'Board comment'}</p>
                    <p className="text-xs text-gray-400 mt-1">Comment</p>
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
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
      </main>
    </div>
  )
}
