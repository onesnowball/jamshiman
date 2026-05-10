import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { UnifiedPostForm } from '@/components/boards/UnifiedPostForm'
import { UpvoteButton } from '@/components/boards/UpvoteButton'
import { createClient } from '@/lib/supabase/server'
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
  const viewer = await getOptionalViewer()

  const { data: deptData } = await supabase
    .from('departments')
    .select('*')
    .eq('active', true)
    .order('name')
  const departments = (deptData ?? []) as Department[]
  const deptMap = new Map(departments.map(d => [d.id, d]))

  const activeDept = searchParams?.dept
    ? departments.find(d => d.slug === searchParams.dept) ?? null
    : null

  let query = supabase
    .from('posts')
    .select('*')
    .eq('board_type', 'department')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40)

  if (activeDept) {
    query = query.eq('dept_id', activeDept.id)
  }

  const { data: postsData } = await query
  const posts = (postsData ?? []) as Post[]

  const emailMap = await getAuthEmailMap(posts.map(p => p.author_id))

  const feed: FeedPost[] = await Promise.all(posts.map(async post => {
    const [{ count: commentCount }, { count: upvoteCount }] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id).eq('status', 'active'),
      supabase.from('post_votes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    ])

    const dept = deptMap.get(post.dept_id)
    const authorLabel = post.is_anonymous
      ? getAnonymousHandle(post.author_id, post.id)
      : toPublicHandle(emailMap.get(post.author_id))

    return {
      ...post,
      commentCount: commentCount ?? 0,
      upvoteCount: upvoteCount ?? 0,
      authorLabel,
      deptName: dept?.name ?? '',
    }
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Community</h1>
          <p className="text-sm text-gray-500 mt-1">
            Anonymous-first threads across all departments. Ask anything.
          </p>
        </div>

        {viewer ? (
          <UnifiedPostForm departments={departments} />
        ) : (
          <div className="card p-4 text-sm text-gray-500">
            <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Sign in</Link> to post.
          </div>
        )}

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

        {!feed.length ? (
          <div className="card p-10 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-700">No posts yet.</p>
            <p className="text-xs mt-1">Be the first to start a thread.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map(post => {
              const dept = deptMap.get(post.dept_id)
              return (
                <Link
                  key={post.id}
                  href={`/boards/${dept?.slug ?? 'unknown'}/${post.id}`}
                  className="card p-5 block hover:border-brand-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-brand-700 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
                          {post.deptName.replace(' Engineering', '').replace(' Sciences', '')}
                        </span>
                      </div>
                      <h2 className="font-medium text-gray-900">{post.title}</h2>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.body}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1.5">
                      <div className="flex items-center justify-end gap-2">
                        <UpvoteButton
                          type="post"
                          id={post.id}
                          initialCount={post.upvoteCount}
                          initialVoted={false}
                          isLoggedIn={!!viewer}
                        />
                        <div className="badge-gray text-xs">{post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}</div>
                      </div>
                      <p className="text-xs text-gray-400">{post.authorLabel}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
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
