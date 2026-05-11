'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  contentType: 'post' | 'comment'
  contentId: string
}

export function PendingDeleteActions({ contentType, contentId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(action: 'approve' | 'deny') {
    setLoading(action)
    try {
      const endpoint = contentType === 'post'
        ? `/api/posts/${contentId}`
        : `/api/comments/${contentId}`

      // approve → set removed; deny → set active
      const newStatus = action === 'approve' ? 'removed' : 'active'

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
        onClick={() => handleAction('deny')}
        disabled={!!loading}
        className="btn-secondary text-xs py-1.5"
      >
        {loading === 'deny'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <X className="w-3.5 h-3.5 text-gray-500" />
        }
        Restore
      </button>
      <button
        onClick={() => handleAction('approve')}
        disabled={!!loading}
        className="btn-danger text-xs py-1.5"
      >
        {loading === 'approve'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Check className="w-3.5 h-3.5" />
        }
        Approve removal
      </button>
    </div>
  )
}
