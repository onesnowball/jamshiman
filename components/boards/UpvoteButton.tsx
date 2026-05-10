'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'

export function UpvoteButton({
  type,
  id,
  initialCount,
  initialVoted,
  isLoggedIn,
}: {
  type: 'post' | 'comment'
  id: string
  initialCount: number
  initialVoted: boolean
  isLoggedIn: boolean
}) {
  const [count, setCount]   = useState(initialCount)
  const [voted, setVoted]   = useState(initialVoted)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn || loading) return
    setLoading(true)
    try {
      const res  = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })
      const data = await res.json()
      if (res.ok) {
        setVoted(data.voted)
        setCount(prev => prev + (data.voted ? 1 : -1))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!isLoggedIn || loading}
      title={isLoggedIn ? (voted ? 'Remove upvote' : 'Upvote') : 'Sign in to upvote'}
      className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 transition-colors ${
        voted
          ? 'bg-brand-100 text-brand-700 border border-brand-200'
          : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <ThumbsUp className="w-3.5 h-3.5" />
      {count}
    </button>
  )
}
