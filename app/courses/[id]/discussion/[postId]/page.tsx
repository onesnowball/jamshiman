import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, MessageSquareText } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { FlagButton } from '@/components/FlagButton'
import { CommentForm } from '@/components/forms/CommentForm'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { getOptionalViewer } from '@/lib/server-auth'
import { createClient } from '@/lib/supabase/server'
import type { Comment, Course, Post } from '@/types/database'

type CourseWithDepartment = Course & {
  departments: { name: string | null } | null
}

type PostWithHandle = Post & { authorLabel: string }
type CommentWithHandle = Comment & { authorLabel: string }

export default async function CourseDiscussionPostPage({
  params,
}: {
  params: { id: string; postId: string }
}) {
  const supabase = createClient()
  const viewer = await getOptionalViewer()

  const { data: courseData } = await supabase
    .from('courses')
    .select('*, departments(name)')
    .eq('id', params.id)
    .single()
  const course = courseData as CourseWithDepartment | null
  if (!course) notFound()

  const { data: postData } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.postId)
    .eq('course_id', course.id)
    .eq('board_type', 'course')
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
          <Link href="/courses" className="hover:text-gray-600">Courses</Link>
          <span>/</span>
          <Link href={`/courses/${course.id}`} className="hover:text-gray-600">{course.code}</Link>
          <span>/</span>
          <Link href={`/courses/${course.id}?tab=discussion`} className="hover:text-gray-600">Discussion</Link>
        </div>

        <article className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-700">{course.code}</p>
              <h1 className="text-2xl font-semibold text-gray-900 mt-1">{postWithHandle.title}</h1>
              <p className="text-sm text-gray-400 mt-2">
                {postWithHandle.authorLabel} · {new Date(postWithHandle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {course.name}
                {course.departments?.name ? ` · ${course.departments.name}` : ''}
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
                Comments are limited to verified UMich users so course threads stay grounded in actual student context.
              </p>
              <Link href="/auth/login" className="btn-secondary mt-4">Sign in</Link>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-gray-500" />
            <h2 className="font-medium text-gray-900">
              {commentsWithHandles.length} comment{commentsWithHandles.length === 1 ? '' : 's'}
            </h2>
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
