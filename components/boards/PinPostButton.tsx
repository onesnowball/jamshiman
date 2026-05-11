'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, PinOff, Loader2 } from 'lucide-react'

export function PinPostButton({
  postId,
  isPinned,
}: {
  postId: string
  isPinned: boolean
}) {
  const router = useRouter()
  const [pinned, setPinned] = useState(isPinned)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !pinned }),
    })
    if (res.ok) {
      setPinned(p => !p)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={pinned ? 'Unpin post' : 'Pin to top'}
      className={`flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 ${
        pinned
          ? 'text-amber-500 hover:text-amber-700'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : pinned
          ? <PinOff className="w-3.5 h-3.5" />
          : <Pin className="w-3.5 h-3.5" />
      }
      {pinned ? 'Unpin' : 'Pin'}
    </button>
  )
}
