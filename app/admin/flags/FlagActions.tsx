'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  contentType: string
  contentId: string
}

export function FlagActions({ contentType, contentId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(action: 'dismiss' | 'remove') {
    setLoading(action)
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Admin action failed.')
      }
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => handleAction('dismiss')}
        disabled={!!loading}
        className="btn-secondary text-xs py-1.5"
        title="Dismiss — content stays visible"
      >
        {loading === 'dismiss'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Check className="w-3.5 h-3.5 text-green-600" />
        }
        Dismiss
      </button>
      <button
        onClick={() => handleAction('remove')}
        disabled={!!loading}
        className="btn-danger text-xs py-1.5"
        title="Remove — hides content from all users"
      >
        {loading === 'remove'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <X className="w-3.5 h-3.5" />
        }
        Remove
      </button>
    </div>
  )
}
