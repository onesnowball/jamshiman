'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore, Loader2 } from 'lucide-react'

export function ArchivePostButton({
  postId,
  currentStatus,
  onStatusChange,
}: {
  postId: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const isArchived = currentStatus === 'archived'

  async function handleClick() {
    const newStatus = isArchived ? 'active' : 'archived'
    if (!confirm(isArchived ? 'Restore this post?' : 'Archive this post? It will be hidden from users.')) return
    setLoading(true)
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    if (res.ok) onStatusChange?.(newStatus)
    else alert('Action failed.')
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : isArchived
          ? <ArchiveRestore className="w-3.5 h-3.5" />
          : <Archive className="w-3.5 h-3.5" />
      }
      {isArchived ? 'Unarchive' : 'Archive'}
    </button>
  )
}
