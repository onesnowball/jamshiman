'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ThumbsUp, Search, Hash, Pin } from 'lucide-react'
import { timeAgo } from '@/lib/format/relative-time'

type FeedPost = {
  id: string
  title: string
  body?: string
  created_at: string
  dept_id: string
  deptName: string
  authorLabel: string
  upvoteCount: number
  commentCount: number
  is_pinned?: boolean
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
      {/* Search */}
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
        <div className="card p-14 text-center">
          <MessageSquare className="w-9 h-9 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-700">
            {query ? 'No posts match your search.' : 'Nothing here yet.'}
          </p>
          {!query && (
            <p className="text-xs text-gray-400 mt-1">Be the first to start a thread.</p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-50/80">
          {filtered.map((post) => {
            const deptSlug = deptSlugMap[post.dept_id] ?? 'unknown'
            const shortDept = post.deptName
              .replace(' Engineering', ' Eng')
              .replace(' Sciences', '')
              .replace(' & Technology', '')
            return (
              <Link
                key={post.id}
                href={`/${school}/boards/${deptSlug}/${post.id}`}
                className={`group flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition-colors ${post.is_pinned ? 'bg-amber-50/40 hover:bg-amber-50/60' : ''}`}
              >
                {/* Left: engagement bar */}
                <div className="flex flex-col items-center gap-1 pt-0.5 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0 min-w-[32px]">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold tabular-nums">{post.upvoteCount}</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {post.is_pinned && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <Pin className="w-2.5 h-2.5" />Pinned
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-600 font-semibold bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      <Hash className="w-2.5 h-2.5" />{shortDept}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">
                      {post.authorLabel} · {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors">
                    {post.title}
                  </h2>
                </div>

                {/* Right: comment count */}
                <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 pt-0.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-medium">{post.commentCount}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
