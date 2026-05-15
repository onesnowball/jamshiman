import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, GraduationCap, BookOpen, MessageSquare, Layers, ArrowRight, Plus } from 'lucide-react'
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

  // Unauthenticated visitors → redirect to login
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
    { href: `/${params.school}/advisors`,    icon: GraduationCap, label: 'Find an advisor',       desc: 'Search reviews by name or lab' },
    { href: `/${params.school}/departments`, icon: Layers,        label: 'Browse your department', desc: 'Advisors, courses, and discussion' },
    { href: `/${params.school}/courses`,     icon: BookOpen,      label: 'Review a course',        desc: 'Share your experience' },
    { href: `/${params.school}/boards/new`,  icon: Plus,          label: 'Ask anonymously',        desc: 'Post to your school\'s boards' },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-1">{university.name}</p>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">
          Advisor reviews, course ratings, and anonymous boards — verified by your .edu email.
        </p>
      </div>

      {/* Pulse — surface daily check-in CTA so it's not buried in the nav */}
      <SchoolHomePulseCard school={params.school} />

      {/* Search */}
      <div>
        <Link
          href={`/${params.school}/advisors`}
          prefetch={false}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-400 text-sm hover:border-brand-300 hover:shadow-sm transition-all"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          Search advisors, courses, departments…
        </Link>
      </div>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="card p-4 hover:border-brand-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-medium text-gray-900 group-hover:text-brand-700">{label}</span>
              </div>
              <p className="text-xs text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Departments */}
      {departments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Departments</h2>
            <Link href={`/${params.school}/departments`} prefetch={false} className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {departments.map(dept => (
              <Link
                key={dept.id}
                href={`/${params.school}/departments/${dept.slug}`}
                prefetch={false}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
              >
                {dept.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Recent board posts
          </h2>
          <Link href={`/${params.school}/boards`} prefetch={false} className="text-xs text-brand-600 hover:underline">
            View all →
          </Link>
        </div>

        {!recentPosts.length ? (
          <div className="card p-6 text-center text-gray-400">
            <p className="text-sm">No posts yet. Start the first conversation.</p>
            <Link href={`/${params.school}/boards/new`} prefetch={false} className="btn-primary text-xs py-1.5 inline-flex mt-3">
              <Plus className="w-3.5 h-3.5" /> Post anonymously
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPosts.map(post => {
              // Department post → /{school}/boards/{deptSlug}/{postId}
              // Course discussion post → /{school}/courses/{courseId}/discussion/{postId}
              // Falls back to /{school}/boards if neither slug nor course_id is present.
              const deptSlug = post.departments?.slug
              const href = post.board_type === 'course' && post.course_id
                ? `/${params.school}/courses/${post.course_id}/discussion/${post.id}`
                : deptSlug
                  ? `/${params.school}/boards/${deptSlug}/${post.id}`
                  : `/${params.school}/boards`
              return (
                <Link
                  key={post.id}
                  href={href}
                  prefetch={false}
                  className="card p-3 hover:border-brand-200 hover:shadow-sm transition-all group block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700 truncate">{post.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {post.is_anonymous
                          ? getAnonymousHandle(post.author_id, post.id)
                          : getAuthorLabel(post.author_id, handleMap, emailMap)
                        }
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(post.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent advisor reviews */}
      {recentReviews.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              Recent advisor reviews
            </h2>
            <Link href={`/${params.school}/advisors`} prefetch={false} className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentReviews.map(review => (
              <div key={review.id} className="card p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-600">{review.advisors?.name ?? 'Advisor'}</p>
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{review.anonymized_text}</p>
                <p className="text-xs text-gray-400">{timeAgo(review.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contribution CTA */}
      <section className="card p-5 bg-brand-50 border-brand-100 space-y-2">
        <h3 className="text-sm font-semibold text-brand-800">Help future students</h3>
        <p className="text-xs text-brand-700">
          Leave an anonymous review for an advisor, lab, or course. Your experience helps others make better decisions.
        </p>
        <div className="flex gap-2 pt-1">
          <Link href={`/${params.school}/advisors`} prefetch={false} className="btn-primary text-xs py-1.5">
            Review an advisor
          </Link>
          <Link href={`/${params.school}/courses`} prefetch={false} className="btn-secondary text-xs py-1.5">
            Review a course
          </Link>
        </div>
        <p className="text-[10px] text-brand-600 opacity-70 pt-1">
          Verified students only · Anonymous by default · Moderated for safety.
        </p>
      </section>

    </main>
  )
}
