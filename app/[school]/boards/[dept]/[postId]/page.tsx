import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, MessageSquareText, Mail } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { getAnonymousHandle } from '@/lib/anonymous-handles'
import { getUniversityBySlug } from '@/lib/school'
import { FlagButton } from '@/components/FlagButton'
import { CommentForm } from '@/components/forms/CommentForm'
import { UpvoteButton } from '@/components/boards/UpvoteButton'
import { DeletePostButton } from '@/components/boards/DeletePostButton'
import { CommentActions } from '@/components/boards/CommentActions'
import type { Comment, Department, Post } from '@/types/database'

type PostWithHandle = Post & { authorLabel: string; upvoteCount: number }
type CommentWithHandle = Comment & { authorLabel: string; upvoteCount: number }

export default async function BoardPostPage({
  params,
}: {
  params: { school: string; dept: string; postId: string }
}) {
  const supabase = createAdminClient()
  const viewer = await getOptionalViewer()
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const { data: departmentData } = await supabase
    .from('departments')
    .select('*')
    .eq('slug', params.dept)
    .eq('university_id', university.id)
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

  const emailMap = await getAuthEmailMap([post.author_id, ...comments.map(c => c.author_id)])

  const { count: postUpvotes } = await supabase
    .from('post_votes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  const postWithHandle: PostWithHandle = {
    ...post,
    authorLabel: post.is_anonymous ? getAnonymousHandle(post.author_id, post.id) : toPublicHandle(emailMap.get(post.author_id)),
    upvoteCount: postUpvotes ?? 0,
  }

  const commentVoteCounts = await Promise.all(comments.map(c =>
    supabase.from('comment_votes').select('*', { count: 'exact', head: true }).eq('comment_id', c.id)
  ))

  const commentsWithHandles: CommentWithHandle[] = comments.map((comment, i) => ({
    ...comment,
    authorLabel: comment.is_anonymous ? getAnonymousHandle(comment.author_id, post.id) : toPublicHandle(emailMap.get(comment.author_id)),
    upvoteCount: commentVoteCounts[i].count ?? 0,
  }))

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 page-enter space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href={`/${params.school}/boards`} className="hover:text-gray-600">Boards</Link>
        <span>/</span>
        <Link href={`/${params.school}/boards/${department.slug}`} className="hover:text-gray-600">{department.name}</Link>
      </div>

      <article className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{postWithHandle.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <p className="text-sm text-gray-400">
                {postWithHandle.authorLabel} · {new Date(postWithHandle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {!post.is_anonymous && viewer && post.author_id !== viewer.id && (
                <Link href={`/messages/${post.author_id}`} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors">
                  <Mail className="w-3 h-3" />Message
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewer?.id === post.author_id && (
              <DeletePostButton postId={post.id} redirectTo={`/${params.school}/boards/${department.slug}`} />
            )}
            <FlagButton contentType="post" contentId={postWithHandle.id} />
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{postWithHandle.body}</p>

        <div className="pt-1">
          <UpvoteButton type="post" id={postWithHandle.id} initialCount={postWithHandle.upvoteCount} initialVoted={false} isLoggedIn={!!viewer} />
        </div>
      </article>

      {viewer ? (
        <CommentForm postId={post.id} />
      ) : (
        <div className="card p-5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-brand-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Sign in to reply</p>
            <p className="text-sm text-gray-500 mt-1">Comments are limited to verified {university.name} users.</p>
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

              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.body}</p>

              <div className="flex items-center justify-between">
                <UpvoteButton type="comment" id={comment.id} initialCount={comment.upvoteCount} initialVoted={false} isLoggedIn={!!viewer} />
                {viewer?.id === comment.author_id && (
                  <CommentActions commentId={comment.id} initialBody={comment.body} />
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  )
}
