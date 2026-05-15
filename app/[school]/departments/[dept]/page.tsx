import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, BookOpen, MessageSquare, Plus, ArrowRight, FlaskConical } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'
import { RatingDisplay } from '@/components/ui/StarRating'
import { getLastDepartmentActivity, getDepartmentWeeklyActivity } from '@/lib/department-activity'
import { getRecentDetroitWeekStarts } from '@/lib/pulse/date'
import { LastActivityLine } from '@/components/department/LastActivityLine'
import { ActivityStrip } from '@/components/department/ActivityStrip'
import type { Course, CourseRatings } from '@/types/database'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function timeAgo(dateStr: string): string {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  if (days < 1)   return 'today'
  if (days < 7)   return `${Math.floor(days)}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: { school: string; dept: string }
  searchParams?: { demo_strip?: string }
}) {
  noStore()
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const supabase = createAdminClient()

  // Resolve department by slug
  const { data: deptData } = await supabase
    .from('departments')
    .select('id, name, slug')
    .eq('slug', params.dept)
    .eq('university_id', university.id)
    .eq('is_board_category', false)
    .single()

  const department = deptData as { id: string; name: string; slug: string } | null
  if (!department) notFound()

  // Fetch all data in parallel
  const [
    { data: advisorsPrimaryData },
    { data: affRows, error: affErr },
    { data: coursesData },
    { data: postsData },
    { data: boardTopicsData },
    { data: aggregatesData },
  ] = await Promise.all([
    (supabase as any)
      .from('advisors')
      .select('id, name, title, lab_name, research_areas, dept_id')
      .eq('dept_id', department.id)
      .eq('active', true)
      .order('name'),
    (supabase as any)
      .from('advisor_department_affiliations')
      .select('advisor_id')
      .eq('dept_id', department.id),
    (supabase as any)
      .from('courses')
      .select('id, code, name, credits')
      .eq('dept_id', department.id)
      .order('code'),
    supabase
      .from('posts')
      .select('id, title, body, created_at, is_anonymous')
      .eq('dept_id', department.id)
      .eq('board_type', 'department')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('departments')
      .select('id, name, slug')
      .eq('university_id', university.id)
      .eq('is_board_category', true)
      .eq('active', true)
      .order('name'),
    supabase
      .from('advisor_aggregates')
      .select('advisor_id, review_count, avg_overall'),
  ])

  const isDemoStrip = searchParams?.demo_strip === '1'
  const [lastActivity, realWeekly] = await Promise.all([
    getLastDepartmentActivity(supabase as any, department.id),
    getDepartmentWeeklyActivity(supabase as any, department.id),
  ])

  // ?demo_strip=1 — visual-only preview of the strip with sample data, so
  // you can see what it looks like before there's enough real activity.
  // Does not insert anything into the database.
  const demoCounts = [0, 1, 2, 0, 3, 1, 5, 2, 0, 7, 1, 4]
  const weeklyActivity = isDemoStrip
    ? getRecentDetroitWeekStarts(12).map((week, i) => ({ week, count: demoCounts[i] }))
    : realWeekly
  const effectiveLastActivity = isDemoStrip ? new Date() : lastActivity

  const primaryList = (advisorsPrimaryData ?? []) as {
    id: string; name: string; title: string | null; lab_name: string | null; research_areas: string[]; dept_id: string
  }[]

  const primaryIds = new Set(primaryList.map(a => a.id))
  const extraIds = affErr
    ? []
    : ((affRows ?? []) as { advisor_id: string }[])
        .map(r => r.advisor_id)
        .filter(id => id && !primaryIds.has(id))

  let extraList: typeof primaryList = []
  if (extraIds.length) {
    const { data: extraData } = await (supabase as any)
      .from('advisors')
      .select('id, name, title, lab_name, research_areas, dept_id')
      .in('id', extraIds)
      .eq('university_id', university.id)
      .eq('active', true)
      .order('name')
    extraList = (extraData ?? []) as typeof primaryList
  }

  const advisors = [...primaryList, ...extraList].sort((a, b) => a.name.localeCompare(b.name))

  const primaryDeptIds = Array.from(new Set(extraList.map(a => a.dept_id)))
  let primaryDeptNameById = new Map<string, string>()
  if (primaryDeptIds.length) {
    const { data: drows } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', primaryDeptIds)
    primaryDeptNameById = new Map(
      ((drows ?? []) as { id: string; name: string }[]).map(d => [d.id, d.name])
    )
  }

  const courses = (coursesData ?? []) as (Course & { id: string; code: string; name: string; credits: number | null })[]

  const posts = (postsData ?? []) as {
    id: string; title: string; body: string; created_at: string; is_anonymous: boolean
  }[]

  const boardTopics = (boardTopicsData ?? []) as { id: string; name: string; slug: string }[]

  const courseIds = courses.map(course => course.id)
  const { data: courseReviewsData } = courseIds.length > 0
    ? await supabase
        .from('course_reviews')
        .select('course_id, ratings')
        .eq('status', 'active')
        .in('course_id', courseIds)
    : { data: [] }

  // Research area frequency across this dept's advisors (primary + extras).
  // Used for the chip cloud that lets users jump straight to a filtered
  // advisor list.
  const areaFreq = new Map<string, number>()
  for (const a of advisors) {
    for (const area of (a.research_areas ?? [])) {
      if (!area) continue
      areaFreq.set(area, (areaFreq.get(area) ?? 0) + 1)
    }
  }
  const allAreasSorted = Array.from(areaFreq.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const VISIBLE_AREA_CHIPS = 14
  const topAreas = allAreasSorted.slice(0, VISIBLE_AREA_CHIPS)
  const moreAreaCount = Math.max(0, allAreasSorted.length - VISIBLE_AREA_CHIPS)

  // Build advisor aggregate map
  const aggMap = new Map(
    ((aggregatesData ?? []) as { advisor_id: string; review_count: number; avg_overall: number }[])
      .map(a => [a.advisor_id, a])
  )

  // Build course review stats map
  const courseStatsMap = new Map<string, { count: number; totals: CourseRatings }>()
  for (const r of (courseReviewsData ?? []) as { course_id: string; ratings: CourseRatings }[]) {
    const entry = courseStatsMap.get(r.course_id) ?? {
      count: 0, totals: { difficulty: 0, usefulness: 0, workload: 0, professor: 0 },
    }
    entry.count++
    entry.totals.difficulty  += r.ratings.difficulty
    entry.totals.usefulness  += r.ratings.usefulness
    entry.totals.workload    += r.ratings.workload
    entry.totals.professor   += r.ratings.professor
    courseStatsMap.set(r.course_id, entry)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-1">{university.name}</p>
        <h1 className="text-2xl font-semibold text-gray-900">{department.name}</h1>
        <div className="mt-1">
          <LastActivityLine lastActivity={effectiveLastActivity} />
          {effectiveLastActivity && <ActivityStrip weeks={weeklyActivity} />}
        </div>
        <p className="text-sm text-gray-500 mt-2 max-w-lg">
          Advisor reviews, course advice, and anonymous department discussion from verified students.
        </p>

        {/* Jump nav — avoids long scroll past advisors to reach courses/posts */}
        <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-1.5 text-xs">
          <a href="#advisors" className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors">
            Advisors <span className="text-gray-400">({advisors.length})</span>
          </a>
          <a href="#courses" className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors">
            Courses <span className="text-gray-400">({courses.length})</span>
          </a>
          <a href="#posts" className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors">
            Recent posts <span className="text-gray-400">({posts.length})</span>
          </a>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Research areas chips — quick filter into the advisor list */}
          {topAreas.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Browse by research area
                </h2>
                <span className="text-[11px] text-gray-400">
                  {allAreasSorted.length} {allAreasSorted.length === 1 ? 'area' : 'areas'} listed here
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Click any tag to jump to advisors working on it. This is a sample — many advisors list more research areas on their profile.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topAreas.map(([area, count]) => (
                  <Link
                    key={area}
                    href={`/${params.school}/advisors?dept=${department.slug}&area=${encodeURIComponent(area)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    {area}
                    <span className="text-gray-400">{count}</span>
                  </Link>
                ))}
                {moreAreaCount > 0 && (
                  <Link
                    href={`/${params.school}/advisors?dept=${department.slug}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    +{moreAreaCount} more area{moreAreaCount === 1 ? '' : 's'} →
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* Advisors — capped preview + view-all link */}
          <section id="advisors" className="space-y-3 scroll-mt-20">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-600" />
              Advisors
              <span className="text-xs font-normal text-gray-400">({advisors.length})</span>
            </h2>

            {!advisors.length ? (
              <div className="card p-6 text-center text-gray-400">
                <GraduationCap className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-gray-600">No advisors listed yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {advisors.slice(0, 8).map(advisor => {
                  const agg = aggMap.get(advisor.id)
                  const hasReviews = (agg?.review_count ?? 0) >= 1
                  return (
                    <Link
                      key={advisor.id}
                      href={`/${params.school}/advisors/${advisor.id}`}
                      className="card p-4 flex items-start gap-3 hover:border-brand-200 hover:shadow-md transition-all group"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0 group-hover:bg-brand-100">
                        {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700">{advisor.name}</p>
                          {hasReviews && agg ? (
                            <RatingDisplay value={agg.avg_overall} count={agg.review_count} />
                          ) : (
                            <span className="text-xs text-brand-600 font-medium shrink-0">Be the first to review</span>
                          )}
                        </div>
                        {advisor.title && <p className="text-xs text-gray-400 mt-0.5">{advisor.title}</p>}
                        {advisor.dept_id !== department.id && (
                          <p className="text-xs text-brand-700 mt-0.5">
                            Joint / courtesy listing — primary:{' '}
                            {primaryDeptNameById.get(advisor.dept_id) ?? 'another department'}
                          </p>
                        )}
                        {advisor.lab_name && (
                          <div className="flex items-center gap-1 mt-1">
                            <FlaskConical className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{advisor.lab_name}</span>
                          </div>
                        )}
                        {!hasReviews && (
                          <p className="text-xs text-gray-400 mt-1">Help future students understand this lab.</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
                {advisors.length > 8 && (
                  <Link
                    href={`/${params.school}/advisors?dept=${department.slug}`}
                    className="block text-center text-sm text-brand-600 hover:text-brand-700 hover:underline py-2"
                  >
                    View all {advisors.length} advisors in {department.name} →
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* Courses — capped preview + view-all link */}
          <section id="courses" className="space-y-3 scroll-mt-20">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
              Courses
              <span className="text-xs font-normal text-gray-400">({courses.length})</span>
            </h2>

            {!courses.length ? (
              <div className="card p-6 text-center text-gray-400">
                <BookOpen className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-gray-600">No courses listed yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.slice(0, 8).map(course => {
                  const stats = courseStatsMap.get(course.id)
                  const avg = stats && stats.count > 0 ? {
                    difficulty: stats.totals.difficulty / stats.count,
                    usefulness: stats.totals.usefulness / stats.count,
                    workload:   stats.totals.workload   / stats.count,
                  } : null
                  return (
                    <Link
                      key={course.id}
                      href={`/${params.school}/courses/${course.id}`}
                      className="card p-4 flex items-center justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded font-mono">
                            {course.code}
                          </span>
                          {course.credits && <span className="text-xs text-gray-400">{course.credits} cr</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1 group-hover:text-brand-700 truncate">
                          {course.name}
                        </p>
                        {avg ? (
                          <div className="flex gap-3 mt-1">
                            <span className="text-[10px] text-gray-500">Difficulty <strong className="text-gray-700">{avg.difficulty.toFixed(1)}</strong></span>
                            <span className="text-[10px] text-gray-500">Workload <strong className="text-gray-700">{avg.workload.toFixed(1)}</strong></span>
                            <span className="text-[10px] text-gray-500">Usefulness <strong className="text-gray-700">{avg.usefulness.toFixed(1)}</strong></span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-brand-600 mt-1">No reviews yet · Share what taking it was like.</p>
                        )}
                      </div>
                      {stats && stats.count > 0 && (
                        <span className="badge-gray shrink-0">{stats.count} review{stats.count !== 1 ? 's' : ''}</span>
                      )}
                    </Link>
                  )
                })}
                {courses.length > 8 && (
                  <Link
                    href={`/${params.school}/courses?dept=${department.slug}`}
                    className="block text-center text-sm text-brand-600 hover:text-brand-700 hover:underline py-2"
                  >
                    View all {courses.length} courses in {department.name} →
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* Department discussion */}
          <section id="posts" className="space-y-3 scroll-mt-20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                Department discussion
              </h2>
              <Link
                href={`/${params.school}/boards/new`}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <Plus className="w-3 h-3" /> Ask anonymously
              </Link>
            </div>

            {!posts.length ? (
              <div className="card p-6 text-center text-gray-400">
                <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-gray-700">No department posts yet.</p>
                <p className="text-xs mt-1">Ask the first anonymous question.</p>
                <Link
                  href={`/${params.school}/boards/new`}
                  className="btn-primary text-xs py-1.5 inline-flex mt-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Ask anonymously
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map(post => (
                  <Link
                    key={post.id}
                    href={`/${params.school}/boards/${params.dept}/${post.id}`}
                    className="card p-4 hover:border-brand-200 hover:shadow-md transition-all group block"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700">{post.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.body}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 mt-1 ml-auto" />
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  href={`/${params.school}/boards?dept=${params.dept}`}
                  className="text-xs text-brand-600 hover:underline block text-center pt-1"
                >
                  See all department posts →
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: board topics */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Discuss anonymously</h3>
            <p className="text-xs text-gray-500">Browse or post in your school's community boards.</p>
            <div className="flex flex-col gap-1.5">
              {boardTopics.length > 0 ? boardTopics.map(topic => (
                <Link
                  key={topic.id}
                  href={`/${params.school}/boards?dept=${topic.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-sm text-gray-700 transition-colors group"
                >
                  <span>#{topic.name}</span>
                  <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-brand-500" />
                </Link>
              )) : (
                <Link
                  href={`/${params.school}/boards`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-brand-50 text-sm text-gray-700"
                >
                  View all boards <ArrowRight className="w-3 h-3 text-gray-300" />
                </Link>
              )}
            </div>
          </div>

          <div className="card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800">Help future students</h3>
            <p className="text-xs text-gray-500">
              Leave an anonymous review for an advisor or course in this department.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Link href={`/${params.school}/advisors`} className="btn-secondary text-xs py-1.5 justify-center">
                Review an advisor
              </Link>
              <Link href={`/${params.school}/courses`} className="btn-secondary text-xs py-1.5 justify-center">
                Review a course
              </Link>
            </div>
            <p className="text-[10px] text-gray-400 text-center pt-1">
              Verified students only · Anonymous by default · Moderated for safety.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
