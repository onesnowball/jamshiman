'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ThumbsUp, Search } from 'lucide-react'

type FeedPost = {
  id: string
  title: string
  created_at: string
  dept_id: string
  deptName: string
  authorLabel: string
  upvoteCount: number
  commentCount: number
}

export function BoardFeed({
  feed,
  school,
  deptSlugMap,
}: {
  feed: FeedPost[]
  school: string
  deptSlugMap: Record<string, string>
}) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? feed.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.deptName.toLowerCase().includes(query.toLowerCase())
      )
    : feed

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search posts…"
          className="input pl-9"
        />
      </div>

      {!filtered.length ? (
        <div className="card p-12 text-center text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-700">
            {query ? 'No posts match your search.' : 'No posts yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {filtered.map(post => {
            const deptSlug = deptSlugMap[post.dept_id] ?? 'unknown'
            return (
              <Link
                key={post.id}
                href={`/${school}/boards/${deptSlug}/${post.id}`}
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
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{post.upvoteCount}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
