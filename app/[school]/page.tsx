import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  GraduationCap,
  BookOpen,
  Layers,
  Plus,
  ArrowUpRight,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getUniversityBySlug, slugToDomain } from '@/lib/school'
import { getAnonymousHandle } from '@/lib/anonymous-handles'
import { getAuthEmailMap, getHandleMap, getAuthorLabel } from '@/lib/admin-users'
import type { Post } from '@/types/database'
import { timeAgo } from '@/lib/format/relative-time'
import { SchoolHomePulseCard } from '@/components/pulse/SchoolHomePulseCard'

export const dynamic = 'force-dynamic'

export default async function SchoolHomePage({ params }: { params: { school: string } }) {
  const [university, viewer] = await Promise.all([
    getUniversityBySlug(params.school),
    getOptionalViewer(),
  ])
  if (!university) notFound()
  if (!viewer) redirect(`/auth/login?school=${slugToDomain(params.school)}`)

  const supabase = createAdminClient()

  const [{ data: recentPostsData }, { data: deptData }, { data: reviewData }] = await Promise.all([
    (supabase as any)
      .from('posts')
      .select('id, title, body, created_at, is_anonymous, author_id, dept_id, course_id, board_type, departments(slug)')
      .eq('university_id', university.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('departments')
      .select('id, name, slug')
      .eq('university_id', university.id)
      .eq('is_board_category', false)
      .eq('active', true)
      .order('name')
      .limit(6),
    (supabase as any)
      .from('advisor_reviews')
      .select('id, advisor_id, anonymized_text, created_at, advisors!inner(name, university_id)')
      .eq('advisors.university_id', university.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const recentPosts = (recentPostsData ?? []) as Array<
    Post & {
      dept_id: string
      course_id: string | null
      departments: { slug: string } | null
    }
  >
  const departments = (deptData ?? []) as { id: string; name: string; slug: string }[]
  const recentReviews = (reviewData ?? []) as {
    id: string; advisor_id: string; anonymized_text: string; created_at: string
    advisors: { name: string } | null
  }[]

  const authorIds = recentPosts.map(p => p.author_id)
  const [emailMap, handleMap] = await Promise.all([
    getAuthEmailMap(authorIds),
    getHandleMap(authorIds),
  ])

  const quickActions = [
    { href: `/${params.school}/advisors`,    icon: GraduationCap, label: 'Find an advisor',     desc: 'Reviews by name or lab' },
    { href: `/${params.school}/departments`, icon: Layers,        label: 'Browse departments',  desc: 'Advisors, courses, threads' },
    { href: `/${params.school}/courses`,     icon: BookOpen,      label: 'Review a course',     desc: 'Share what taking it was like' },
    { href: `/${params.school}/boards/new`,  icon: Plus,          label: 'Ask anonymously',     desc: 'Post to the boards' },
  ]

  return (
    <>
      {/* Inter for the body — quiet, professional. One @import keeps this
          self-contained for the dashboard demo; if approved, this lifts to
          app/layout.tsx so it applies site-wide. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; }
      `}</style>

      <main className="font-inter bg-stone-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-5 py-10 space-y-10">

          {/* Header */}
          <header>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
              {university.name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-lg">
              Advisor reviews, course ratings, and anonymous boards — verified by your .edu email.
            </p>
          </header>

          {/* Pulse — surface daily check-in */}
          <SchoolHomePulseCard school={params.school} />

          {/* Search — quiet, full-width affordance */}
          <Link
            href={`/${params.school}/advisors`}
            prefetch={false}
            className="group flex items-center gap-3 w-full rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200 text-sm text-stone-500 shadow-sm hover:ring-slate-300 hover:text-stone-700 transition-all"
          >
            <Search className="w-4 h-4 shrink-0 text-stone-400 group-hover:text-slate-700 transition-colors" />
            <span>Search advisors, courses, departments</span>
          </Link>

          {/* Quick actions */}
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  className="group rounded-xl bg-white px-4 py-4 ring-1 ring-stone-200 shadow-sm hover:ring-slate-300 hover:shadow transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-stone-500 group-hover:text-slate-700 transition-colors" />
                        <span className="text-sm font-medium text-stone-900">{label}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-stone-500">{desc}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-stone-300 group-hover:text-slate-700 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Departments */}
          {departments.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Departments
                </h2>
                <Link
                  href={`/${params.school}/departments`}
                  prefetch={false}
                  className="text-xs text-slate-700 hover:text-slate-900 hover:underline underline-offset-2"
                >
                  View all →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <Link
                    key={dept.id}
                    href={`/${params.school}/departments/${dept.slug}`}
                    prefetch={false}
                    className="px-3 py-1.5 rounded-full bg-white text-sm text-stone-700 ring-1 ring-stone-200 hover:ring-slate-300 hover:text-slate-900 transition-all"
                  >
                    {dept.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent board posts */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Recent boards
              </h2>
              <Link
                href={`/${params.school}/boards`}
                prefetch={false}
                className="text-xs text-slate-700 hover:text-slate-900 hover:underline underline-offset-2"
              >
                View all →
              </Link>
            </div>

            {!recentPosts.length ? (
              <div className="rounded-xl bg-white ring-1 ring-stone-200 px-5 py-8 text-center">
                <p className="text-sm text-stone-700">
                  The boards are quiet right now.
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Your question is probably someone else&rsquo;s, too.
                </p>
                <Link
                  href={`/${params.school}/boards/new`}
                  prefetch={false}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start the first conversation
                </Link>
              </div>
            ) : (
              <ul className="rounded-xl bg-white ring-1 ring-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
                {recentPosts.map(post => {
                  // Department post  → /{school}/boards/{deptSlug}/{postId}
                  // Course post      → /{school}/courses/{courseId}/discussion/{postId}
                  // Fallback         → boards index, only when neither slug nor course_id is present.
                  const deptSlug = post.departments?.slug
                  const href = post.board_type === 'course' && post.course_id
                    ? `/${params.school}/courses/${post.course_id}/discussion/${post.id}`
                    : deptSlug
                      ? `/${params.school}/boards/${deptSlug}/${post.id}`
                      : `/${params.school}/boards`
                  return (
                    <li key={post.id}>
                      <Link
                        href={href}
                        prefetch={false}
                        className="group flex items-start justify-between gap-4 px-4 py-3 hover:bg-stone-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 group-hover:text-slate-900 truncate">
                            {post.title}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {post.is_anonymous
                              ? getAnonymousHandle(post.author_id, post.id)
                              : getAuthorLabel(post.author_id, handleMap, emailMap)}
                          </p>
                        </div>
                        <span className="shrink-0 mt-0.5 text-[11px] font-mono text-stone-400 tabular-nums">
                          {timeAgo(post.created_at)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Recent advisor reviews */}
          {recentReviews.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Recent advisor reviews
                </h2>
                <Link
                  href={`/${params.school}/advisors`}
                  prefetch={false}
                  className="text-xs text-slate-700 hover:text-slate-900 hover:underline underline-offset-2"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {recentReviews.map(review => (
                  <article
                    key={review.id}
                    className="rounded-xl bg-white ring-1 ring-stone-200 shadow-sm px-5 py-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      {review.advisors?.name ?? 'Advisor'}
                    </p>
                    <p className="mt-2 text-sm text-stone-700 leading-relaxed line-clamp-2">
                      {review.anonymized_text}
                    </p>
                    <p className="mt-2 text-[11px] font-mono text-stone-400 tabular-nums">
                      {timeAgo(review.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Contribution CTA — muted, single sentence */}
          <section className="rounded-xl bg-white ring-1 ring-stone-200 px-5 py-5">
            <h3 className="text-sm font-semibold text-stone-900">Help future students</h3>
            <p className="mt-1.5 text-xs text-stone-600 leading-relaxed max-w-md">
              Leave an anonymous review for an advisor, lab, or course.
              The honesty here only exists because people like you wrote it down.
            </p>
            <div className="mt-4 flex gap-5 text-sm">
              <Link
                href={`/${params.school}/advisors`}
                prefetch={false}
                className="inline-flex items-center gap-1 font-medium text-slate-800 hover:text-slate-900 transition-colors"
              >
                Review an advisor <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/${params.school}/courses`}
                prefetch={false}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-slate-800 transition-colors"
              >
                Review a course <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* Trust footer — canonical phrasing */}
          <footer className="pt-2 pb-6 text-center">
            <p className="text-[11px] text-stone-500 tracking-wide">
              Verified students.
              <span className="text-stone-400"> · </span>
              Anonymous by default.
              <span className="text-stone-400"> · </span>
              Moderated.
            </p>
          </footer>

        </div>
      </main>
    </>
  )
}
