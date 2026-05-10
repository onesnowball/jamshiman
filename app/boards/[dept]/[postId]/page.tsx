import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, MessageSquareText } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { FlagButton } from '@/components/FlagButton'
import { CommentForm } from '@/components/forms/CommentForm'
import type { Comment, Department, Post } from '@/types/database'

type PostWithHandle = Post & { authorLabel: string }
type CommentWithHandle = Comment & { authorLabel: string }

export default async function BoardPostPage({
  params,
}: {
  params: { dept: string; postId: string }
}) {
  const supabase = createClient()
  const viewer = await getOptionalViewer()

  const { data: departmentData } = await supabase
    .from('departments')
    .select('*')
    .eq('slug', params.dept)
    .eq('active', true)
    .single()
  const department = departmentData as Department | null
  if (!department) notFound()

  const { data: postData } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.postId)
    .eq('dept_id', department.id)
    .eq('board_type', 'department')
    .eq('status', 'active')
    .single()
  const post = postData as Post | null
  if (!post) notFound()

  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', post.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
  const comments = (commentsData ?? []) as Comment[]

  const emailMap = await getAuthEmailMap([post.author_id, ...comments.map(comment => comment.author_id)])
  const postWithHandle: PostWithHandle = {
    ...post,
    authorLabel: post.is_anonymous ? 'Anonymous' : toPublicHandle(emailMap.get(post.author_id)),
  }
  const commentsWithHandles: CommentWithHandle[] = comments.map(comment => ({
    ...comment,
    authorLabel: comment.is_anonymous ? 'Anonymous' : toPublicHandle(emailMap.get(comment.author_id)),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/boards" className="hover:text-gray-600">Boards</Link>
          <span>/</span>
          <Link href={`/boards/${department.slug}`} className="hover:text-gray-600">{department.name}</Link>
        </div>

        <article className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{postWithHandle.title}</h1>
              <p className="text-sm text-gray-400 mt-2">
                {postWithHandle.authorLabel} · {new Date(postWithHandle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <FlagButton contentType="post" contentId={postWithHandle.id} />
          </div>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {postWithHandle.body}
          </p>
        </article>

        {viewer ? (
          <CommentForm postId={post.id} />
        ) : (
          <div className="card p-5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-brand-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Sign in to reply</p>
              <p className="text-sm text-gray-500 mt-1">
                Comments are limited to verified UMich users so each department board stays trustworthy.
              </p>
              <Link href="/auth/login" className="btn-secondary mt-4">Sign in</Link>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-gray-500" />
            <h2 className="font-medium text-gray-900">{commentsWithHandles.length} comment{commentsWithHandles.length === 1 ? '' : 's'}</h2>
          </div>

          {!commentsWithHandles.length ? (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-sm">No comments yet. Add the first reply.</p>
            </div>
          ) : (
            commentsWithHandles.map(comment => (
              <div key={comment.id} className="card p-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{comment.authorLabel}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <FlagButton contentType="comment" contentId={comment.id} />
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {comment.body}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
