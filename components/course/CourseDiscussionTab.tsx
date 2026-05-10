import Link from 'next/link'
import { Lock, MessageSquare, MessageSquareText } from 'lucide-react'
import { NewCourseThreadForm } from '@/components/forms/NewCourseThreadForm'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { getOptionalViewer } from '@/lib/server-auth'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types/database'

type CourseDiscussionPost = Post & {
  authorLabel: string
  commentCount: number
}

export async function CourseDiscussionTab({
  courseId,
  courseCode,
}: {
  courseId: string
  courseCode: string
}) {
  const supabase = createClient()
  const viewer = await getOptionalViewer()

  const { data: postsData } = await supabase
    .from('posts')
    .select('*')
    .eq('course_id', courseId)
    .eq('board_type', 'course')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  const posts = (postsData ?? []) as Post[]

  const emailMap = await getAuthEmailMap(posts.map(post => post.author_id))
  const postCards: CourseDiscussionPost[] = await Promise.all(posts.map(async post => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('status', 'active')

    return {
      ...post,
      commentCount: count ?? 0,
      authorLabel: post.is_anonymous ? 'Anonymous' : toPublicHandle(emailMap.get(post.author_id)),
    }
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-gray-900">Course discussion</h2>
          <p className="text-sm text-gray-500 mt-1">
            Class-scoped threads for practical questions, study signals, and the things people usually text a friend about.
          </p>
        </div>
        <span className="badge-blue">{postCards.length} thread{postCards.length === 1 ? '' : 's'}</span>
      </div>

      {viewer ? (
        <NewCourseThreadForm courseId={courseId} courseCode={courseCode} />
      ) : (
        <div className="card p-5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-brand-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Sign in to start a class thread</p>
            <p className="text-sm text-gray-500 mt-1">
              Reading stays open, but posting is limited to verified UMich users so course discussion stays high-signal.
            </p>
            <Link href="/auth/login" className="btn-secondary mt-4">Sign in</Link>
          </div>
        </div>
      )}

      {!postCards.length ? (
        <div className="card p-10 text-center text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-700">No discussions yet for {courseCode}.</p>
          <p className="text-xs mt-1">
            Be the first to ask a question, share survival advice, or help classmates calibrate the workload.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {postCards.map(post => (
            <Link
              key={post.id}
              href={`/courses/${courseId}/discussion/${post.id}`}
              className="card p-5 block hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{post.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-3">
                    {post.body}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="badge-gray">{post.commentCount} repl{post.commentCount === 1 ? 'y' : 'ies'}</div>
                  <p className="text-xs text-gray-400 mt-2">{post.authorLabel}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
