'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Loader2, MessageSquare } from 'lucide-react'

type ProfilePost = {
  id: string
  title: string
  body: string
  dept_id: string
  departments: { slug: string | null; name: string | null } | null
  universities: { domain: string | null } | null
}

type ProfileComment = {
  id: string
  body: string
  posts: { id: string | null; title: string | null } | null
}

function DeleteButton({ onDelete, label = 'Delete' }: { onDelete: () => Promise<boolean>; label?: string }) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    if (!confirm(`Delete this ${label.toLowerCase()}? This sends a removal request.`)) return
    setLoading(true)
    const ok = await onDelete()
    if (!ok) { setLoading(false); alert('Could not delete.') }
  }
  return (
    <button onClick={handle} disabled={loading} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      {label}
    </button>
  )
}

export function ProfileActivity({
  initialPosts,
  initialComments,
}: {
  initialPosts: ProfilePost[]
  initialComments: ProfileComment[]
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [comments, setComments] = useState(initialComments)

  async function deletePost(postId: string): Promise<boolean> {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId))
    return res.ok
  }

  async function deleteComment(commentId: string): Promise<boolean> {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
    return res.ok
  }

  if (!posts.length && !comments.length) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-gray-700">No board activity yet</p>
        <p className="text-xs mt-1">Threads and comments you create will show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map(post => {
        const school = post.universities?.domain?.split('.')[0]
        const href = school && post.departments?.slug
          ? `/${school}/boards/${post.departments.slug}/${post.id}`
          : '#'
        return (
          <div key={post.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <Link href={href} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 hover:text-brand-700 transition-colors">{post.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Thread · {post.departments?.name ?? 'Board'}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{post.body}</p>
              </Link>
              <DeleteButton onDelete={() => deletePost(post.id)} label="Delete" />
            </div>
          </div>
        )
      })}

      {comments.map(comment => (
        <div key={comment.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{comment.posts?.title ?? 'Board comment'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Comment</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{comment.body}</p>
            </div>
            <DeleteButton onDelete={() => deleteComment(comment.id)} label="Delete" />
          </div>
        </div>
      ))}
    </div>
  )
}
