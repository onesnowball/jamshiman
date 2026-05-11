import Link from 'next/link'
import { Plus } from 'lucide-react'
import { BoardFeed } from '@/components/boards/BoardFeed'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAnonymousHandle } from '@/lib/anonymous-handles'
import { getAuthEmailMap, getHandleMap, getAuthorLabel } from '@/lib/admin-users'
import { getUniversityBySlug } from '@/lib/school'
import type { Department, Post } from '@/types/database'

type FeedPost = Post & { commentCount: number; authorLabel: string; deptName: string; upvoteCount: number }

export default async function BoardsPage({
  params,
  searchParams,
}: {
  params: { school: string }
  searchParams?: { dept?: string; returnTo?: string }
}) {
  const supabase = createAdminClient()
  const viewer = await getOptionalViewer()
  const university = await getUniversityBySlug(params.school)
  if (!university) return null

  // Admin campus-switcher round-trip: middleware set last_school cookie on this
  // request, now redirect to the target page so admin sees the new context.
  if (searchParams?.returnTo === 'admin') {
    const { redirect } = await import('next/navigation')
    redirect('/admin')
  }

  const { data: deptData } = await supabase
    .from('departments')
    .select('*')
    .eq('active', true)
    .eq('university_id', university.id)
    .order('name')

  const raw = (deptData ?? []) as Department[]
  // Board categories first (General before others), then academic departments
  const boardFirst = raw.filter(d => d.is_board_category)
  const academic = raw.filter(d => !d.is_board_category)
  // Keep General at front if present
  const generalIdx = boardFirst.findIndex(d => d.slug === 'general')
  if (generalIdx > 0) boardFirst.unshift(...boardFirst.splice(generalIdx, 1))
  const departments = [...boardFirst, ...academic]
  const boardFilterDepts = boardFirst
  const deptMap = new Map(departments.map(d => [d.id, d]))

  const activeDept = searchParams?.dept
    ? departments.find(d => d.slug === searchParams!.dept) ?? null
    : null

  let query = supabase
    .from('posts')
    .select('*')
    .eq('board_type', 'department')
    .eq('status', 'active')
    .eq('university_id', university.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (activeDept) query = query.eq('dept_id', activeDept.id)

  const { data: postsData } = await query
  const posts = (postsData ?? []) as Post[]

  const authorIds = posts.map(p => p.author_id)
  const [emailMap, handleMap] = await Promise.all([
    getAuthEmailMap(authorIds),
    getHandleMap(authorIds),
  ])

  const feed: FeedPost[] = await Promise.all(posts.map(async post => {
    const [{ count: commentCount }, { count: upvoteCount }] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id).eq('status', 'active'),
      supabase.from('post_votes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    ])
    const dept = deptMap.get(post.dept_id)
    return {
      ...post,
      commentCount: commentCount ?? 0,
      upvoteCount: upvoteCount ?? 0,
      authorLabel: post.is_anonymous ? getAnonymousHandle(post.author_id, post.id) : getAuthorLabel(post.author_id, handleMap, emailMap),
      deptName: dept?.name ?? '',
    }
  }))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 page-enter space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Community</h1>
        <p className="text-xs text-gray-400 mt-0.5">Anonymous threads · {university.name}</p>
      </div>

      {/* Department filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${params.school}/boards`}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !activeDept ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
          }`}
        >
          All
        </Link>
        {boardFilterDepts.map(d => (
          <Link
            key={d.id}
            href={`/${params.school}/boards?dept=${d.slug}`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeDept?.id === d.id
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            {d.name}
          </Link>
        ))}
      </div>

      {/* New post CTA for empty state */}
      {!feed.length && viewer && (
        <Link href={`/${params.school}/boards/new`} className="btn-primary text-sm inline-flex">
          <Plus className="w-4 h-4" /> Start the first thread
        </Link>
      )}

      {/* Feed with search */}
      <BoardFeed
        feed={feed}
        school={params.school}
        deptSlugMap={Object.fromEntries(Array.from(deptMap.entries()).map(([id, d]) => [id, d.slug]))}
      />
    </main>
  )
}
