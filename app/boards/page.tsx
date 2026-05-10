import Link from 'next/link'
import { MessageSquare, Plus, ThumbsUp } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAnonymousHandle } from '@/lib/anonymous-handles'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import type { Department, Post } from '@/types/database'

type FeedPost = Post & { commentCount: number; authorLabel: string; deptName: string; upvoteCount: number }

export default async function BoardsPage({
  searchParams,
}: {
  searchParams?: { dept?: string }
}) {
  const supabase = createClient()
  const admin = createAdminClient()
  const viewer = await getOptionalViewer()

  const { data: deptData } = await admin
    .from('departments')
    .select('*')
    .eq('active', true)
    .order('name')
  const raw = (deptData ?? []) as Department[]
  const GENERAL_SLUGS = ['general', 'career', 'housing', 'research', 'wellbeing', 'marketplace']
  const departments = [
    ...raw.filter(d => GENERAL_SLUGS.includes(d.slug)).sort((a, b) => GENERAL_SLUGS.indexOf(a.slug) - GENERAL_SLUGS.indexOf(b.slug)),
    ...raw.filter(d => !GENERAL_SLUGS.includes(d.slug)),
  ]
  const deptMap = new Map(departments.map(d => [d.id, d]))

  const activeDept = searchParams?.dept
    ? departments.find(d => d.slug === searchParams!.dept) ?? null
    : null

  let query = supabase
    .from('posts')
    .select('*')
    .eq('board_type', 'department')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  if (activeDept) query = query.eq('dept_id', activeDept.id)

  const { data: postsData } = await query
  const posts = (postsData ?? []) as Post[]

  const emailMap = await getAuthEmailMap(posts.map(p => p.author_id))

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
      authorLabel: post.is_anonymous ? getAnonymousHandle(post.author_id, post.id) : toPublicHandle(emailMap.get(post.author_id)),
      deptName: dept?.name ?? '',
    }
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 page-enter space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Community</h1>
            <p className="text-xs text-gray-400 mt-0.5">Anonymous threads across all departments</p>
          </div>
          {viewer ? (
            <Link
              href="/boards/new"
              className="btn-primary text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Post
            </Link>
          ) : (
            <Link href="/auth/login" className="btn-secondary text-sm">Sign in to post</Link>
          )}
        </div>

        {/* Department filter chips */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/boards"
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !activeDept ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            All
          </Link>
          {departments.map(d => (
            <Link
              key={d.id}
              href={`/boards?dept=${d.slug}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeDept?.id === d.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {d.name.replace(' Engineering', '').replace(' Sciences', '')}
            </Link>
          ))}
        </div>

        {/* Feed */}
        {!feed.length ? (
          <div className="card p-12 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-700">No posts yet.</p>
            {viewer && (
              <Link href="/boards/new" className="btn-primary text-sm mt-4 inline-flex">
                <Plus className="w-4 h-4" /> Start the first thread
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {feed.map(post => {
              const dept = deptMap.get(post.dept_id)
              return (
                <Link
                  key={post.id}
                  href={`/boards/${dept?.slug ?? 'unknown'}/${post.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-brand-700 font-medium bg-brand-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {post.deptName.replace(' Engineering', '').replace(' Sciences', '')}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">
                        {post.authorLabel} · {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-sm font-medium text-gray-900 leading-snug">{post.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />{post.upvoteCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{post.commentCount}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
