'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props =
  | { requestId: string; appealId?: never; userId?: never }
  | { appealId: string; userId: string; requestId?: never }

export function SuspensionReviewButtons({ requestId, appealId, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState('')

  async function act(action: 'approve' | 'deny') {
    setLoading(action)
    setError('')
    try {
      const endpoint = requestId ? '/api/admin/suspension-requests' : '/api/admin/appeals'
      const body = requestId
        ? { request_id: requestId, action }
        : { appeal_id: appealId, action }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => act('approve')}
          disabled={!!loading}
          className="btn-primary text-xs py-1.5 flex-1 justify-center"
        >
          {loading === 'approve'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CheckCircle className="w-3.5 h-3.5" />
          }
          {requestId ? 'Approve — suspend user' : 'Approve — unban user'}
        </button>
        <button
          onClick={() => act('deny')}
          disabled={!!loading}
          className="btn-secondary text-xs py-1.5 flex-1 justify-center"
        >
          {loading === 'deny'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <XCircle className="w-3.5 h-3.5" />
          }
          {requestId ? 'Deny — no action' : 'Deny — keep suspended'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
