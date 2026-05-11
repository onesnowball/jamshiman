'use client'

import { useState } from 'react'
import { ShieldOff, Loader2, X, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  /** True when the current viewer is a global admin (can suspend directly) */
  isGlobalAdmin: boolean
  /** Whether there is already a pending request for this user */
  hasPendingRequest?: boolean
}

export function SuspensionRequestButton({ userId, isGlobalAdmin, hasPendingRequest = false }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(hasPendingRequest)

  async function submit() {
    if (reason.trim().length < 10) {
      setError('Please give at least 10 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const endpoint = isGlobalAdmin ? '/api/admin/users' : '/api/admin/suspension-requests'
      const body = isGlobalAdmin
        ? JSON.stringify({ user_id: userId, is_banned: true })
        : JSON.stringify({ target_user_id: userId, reason: reason.trim() })

      const res = await fetch(endpoint, {
        method: isGlobalAdmin ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed.')
      setOpen(false)
      setDone(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done && !isGlobalAdmin) {
    return (
      <span className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-700">
        <AlertTriangle className="w-3 h-3" />
        Request sent
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
      >
        <ShieldOff className="w-3 h-3" />
        {isGlobalAdmin ? 'Suspend' : 'Request suspension'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {isGlobalAdmin ? 'Suspend user' : 'Request suspension'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isGlobalAdmin
                    ? 'This will immediately ban the user from all activity and log them out.'
                    : 'A global admin will review your request before any action is taken.'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="section-label">Reason{isGlobalAdmin ? ' (optional for your records)' : ' *'}</label>
              <textarea
                rows={4}
                value={reason}
                onChange={e => { setReason(e.target.value); setError('') }}
                placeholder="Describe the behaviour that warrants suspension…"
                className="textarea"
                autoFocus
              />
              <p className="text-xs text-gray-400">{reason.length} / 1000 characters</p>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="btn-secondary text-xs py-1.5">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading || (!isGlobalAdmin && reason.trim().length < 10)}
                className="btn-danger text-xs py-1.5"
              >
                {loading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ShieldOff className="w-3.5 h-3.5" />
                }
                {isGlobalAdmin ? 'Suspend now' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
