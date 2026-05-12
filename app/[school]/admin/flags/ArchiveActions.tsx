'use client'

import { useState } from 'react'
import { RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  contentType: 'post' | 'comment'
  contentId: string
}

export function ArchiveActions({ contentType, contentId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(newStatus: 'active' | 'removed') {
    setLoading(newStatus)
    try {
      const endpoint = contentType === 'post'
        ? `/api/posts/${contentId}`
        : `/api/comments/${contentId}`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Action failed.')
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => handleAction('active')}
        disabled={!!loading}
        className="btn-secondary text-xs py-1.5"
      >
        {loading === 'active'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <RotateCcw className="w-3.5 h-3.5 text-green-600" />
        }
        Restore
      </button>
      <button
        onClick={() => handleAction('removed')}
        disabled={!!loading}
        className="btn-danger text-xs py-1.5"
      >
        {loading === 'removed'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Trash2 className="w-3.5 h-3.5" />
        }
        Remove
      </button>
    </div>
  )
}
