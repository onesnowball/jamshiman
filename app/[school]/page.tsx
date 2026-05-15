import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  BookOpen,
  Layers,
  Plus,
  ArrowUpRight,
  Search,
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
    { href: `/${params.school}/advisors`,    icon: GraduationCap, label: 'Find an advisor',       desc: 'Reviews by name or lab' },
    { href: `/${params.school}/departments`, icon: Layers,        label: 'Browse departments',    desc: 'Advisors, courses, threads' },
    { href: `/${params.school}/courses`,     icon: BookOpen,      label: 'Review a course',        desc: 'Share what taking it was like' },
    { href: `/${params.school}/boards/new`,  icon: Plus,          label: 'Ask anonymously',        desc: 'Post to the boards' },
  ]

  return (
    <>
      {/* Type, palette, and motion tokens. Kept inline so the dashboard is a
          self-contained restyle without leaking to other pages. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');

        .font-display { font-family: 'Lora', ui-serif, Georgia, serif; }

        @keyframes home-fade-up {
          from { opacity: 0; transform: translateY(6px) }
          to   { opacity: 1; transform: translateY(0)   }
        }
        .fade-up {
          opacity: 0;
          animation: home-fade-up 480ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
        }

        /* Slow pulse on the uncompleted Pulse-CTA dot. Lives here so the
           CTA reads "alive" without bringing in any animation library. */
        @keyframes home-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.55 }
          70%  { transform: scale(2.6); opacity: 0    }
          100% { transform: scale(2.6); opacity: 0    }
        }
        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: currentColor;
          animation: home-pulse-ring 2400ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .fade-up { opacity: 1; animation: none }
          .pulse-dot::before { animation: none; opacity: 0 }
        }
      `}</style>

      <main className="bg-stone-950 text-stone-100 min-h-screen">
        <div className="max-w-3xl mx-auto px-5 py-12 space-y-12">

          {/* Header */}
          <header className="fade-up" style={{ animationDelay: '0ms' }}>
            <p className="text-[11px] tracking-[0.18em] uppercase text-amber-300/80 font-medium">
              {university.name}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-stone-100 mt-3 leading-tight tracking-tight">
              Welcome back.
            </h1>
            <p className="text-sm text-stone-400 mt-3 max-w-md leading-relaxed">
              Advisor reviews, course ratings, and anonymous boards —
              <span className="text-stone-300"> verified by your .edu email</span>.
            </p>
          </header>

          {/* Pulse — the unforgettable moment */}
          <section className="fade-up" style={{ animationDelay: '60ms' }}>
            <SchoolHomePulseCard school={params.school} />
          </section>

          {/* Search — a quiet thin line, not a faux input */}
          <section className="fade-up" style={{ animationDelay: '120ms' }}>
            <Link
              href={`/${params.school}/advisors`}
              prefetch={false}
              className="group inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-300 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search advisors, courses, departments</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </section>

          {/* Quick actions */}
          <section className="fade-up space-y-4" style={{ animationDelay: '180ms' }}>
            <h2 className="text-[11px] tracking-[0.18em] uppercase text-stone-500 font-medium">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  className="group rounded-xl border border-stone-800 bg-stone-900 p-4 transition-colors duration-200 hover:border-amber-300/40 hover:bg-stone-800/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-stone-400 group-hover:text-amber-300 transition-colors" />
                        <span className="text-sm text-stone-100 font-medium">{label}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1.5">{desc}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-700 group-hover:text-amber-300 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Departments */}
          {departments.length > 0 && (
            <section className="fade-up space-y-4" style={{ animationDelay: '240ms' }}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] tracking-[0.18em] uppercase text-stone-500 font-medium">
                  Departments
                </h2>
                <Link
                  href={`/${params.school}/departments`}
                  prefetch={false}
                  className="text-xs text-stone-500 hover:text-amber-300 transition-colors"
                >
                  All →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <Link
                    key={dept.id}
                    href={`/${params.school}/departments/${dept.slug}`}
                    prefetch={false}
                    className="px-3 py-1.5 rounded-full border border-stone-800 bg-stone-900 text-sm text-stone-300 hover:border-amber-300/40 hover:text-amber-100 hover:bg-stone-800/70 transition-colors duration-200"
                  >
                    {dept.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent board posts */}
          <section className="fade-up space-y-4" style={{ animationDelay: '300ms' }}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[11px] tracking-[0.18em] uppercase text-stone-500 font-medium">
                Recent boards
              </h2>
              <Link
                href={`/${params.school}/boards`}
                prefetch={false}
                className="text-xs text-stone-500 hover:text-amber-300 transition-colors"
              >
                All →
              </Link>
            </div>

            {!recentPosts.length ? (
              <div className="rounded-xl border border-dashed border-stone-800 px-5 py-8 text-center">
                <p className="font-display text-base text-stone-200">
                  The boards are quiet right now.
                </p>
                <p className="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
                  Be the first voice — your question is probably someone else&rsquo;s, too.
                </p>
                <Link
                  href={`/${params.school}/boards/new`}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start the first conversation
                </Link>
              </div>
            ) : (
              <ol className="divide-y divide-stone-800/70 border-y border-stone-800/70">
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
                        className="group flex items-start justify-between gap-4 py-3 hover:bg-stone-900/60 -mx-2 px-2 rounded-md transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-stone-100 group-hover:text-amber-100 truncate transition-colors">
                            {post.title}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-1">
                            {post.is_anonymous
                              ? getAnonymousHandle(post.author_id, post.id)
                              : getAuthorLabel(post.author_id, handleMap, emailMap)}
                          </p>
                        </div>
                        <span className="text-[11px] text-stone-600 shrink-0 mt-1 tabular-nums">
                          {timeAgo(post.created_at)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {/* Recent advisor reviews */}
          {recentReviews.length > 0 && (
            <section className="fade-up space-y-4" style={{ animationDelay: '360ms' }}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] tracking-[0.18em] uppercase text-stone-500 font-medium">
                  Recent advisor reviews
                </h2>
                <Link
                  href={`/${params.school}/advisors`}
                  prefetch={false}
                  className="text-xs text-stone-500 hover:text-amber-300 transition-colors"
                >
                  All →
                </Link>
              </div>
              <div className="space-y-3">
                {recentReviews.map(review => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-stone-800 bg-stone-900 px-5 py-4 hover:border-amber-300/30 hover:bg-stone-800/60 transition-colors duration-200"
                  >
                    <p className="text-[11px] tracking-wide uppercase text-stone-500 font-medium">
                      {review.advisors?.name ?? 'Advisor'}
                    </p>
                    <p className="text-sm text-stone-200 mt-2 leading-relaxed line-clamp-2">
                      {review.anonymized_text}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-2">{timeAgo(review.created_at)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Contribution CTA — muted, not loud */}
          <section
            className="fade-up rounded-xl border border-stone-800 bg-stone-900/60 px-5 py-5"
            style={{ animationDelay: '420ms' }}
          >
            <h3 className="font-display text-base text-stone-100">Help future students</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed max-w-md">
              Leave an anonymous review for an advisor, lab, or course. The
              honesty here only exists because people like you wrote it down.
            </p>
            <div className="flex gap-4 mt-4 text-sm">
              <Link
                href={`/${params.school}/advisors`}
                prefetch={false}
                className="text-amber-300 hover:text-amber-200 transition-colors inline-flex items-center gap-1"
              >
                Review an advisor <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/${params.school}/courses`}
                prefetch={false}
                className="text-stone-300 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
              >
                Review a course <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* Trust footer */}
          <footer
            className="fade-up pt-2 pb-6 text-center"
            style={{ animationDelay: '480ms' }}
          >
            <p className="text-[11px] text-stone-500 tracking-wide">
              Verified students.
              <span className="text-stone-600"> · </span>
              Anonymous by default.
              <span className="text-stone-600"> · </span>
              Moderated.
            </p>
          </footer>

        </div>
      </main>
    </>
  )
}
