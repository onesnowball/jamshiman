'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export function DeleteAccountRow({ requestedAt }: { requestedAt: string | null }) {
  const [pending, setPending] = useState<boolean>(!!requestedAt)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function request() {
    if (!confirm(
      'Request account deletion?\n\nYour account will be queued for removal. An admin will process the request. Your reviews and posts may stay live anonymously (without your identity attached).\n\nYou can cancel the request anytime before it is processed.'
    )) return
    setBusy(true); setErr(null)
    const res = await fetch('/api/profile/delete-request', { method: 'POST' })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setErr(typeof d?.error === 'string' ? d.error : 'Could not submit request')
      return
    }
    setPending(true)
  }

  async function cancel() {
    setBusy(true); setErr(null)
    const res = await fetch('/api/profile/delete-request', { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setErr(typeof d?.error === 'string' ? d.error : 'Could not cancel')
      return
    }
    setPending(false)
  }

  if (pending) {
    return (
      <div className="card p-4 border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">Account deletion requested</p>
            <p className="text-xs text-amber-800 mt-0.5">
              An admin will process it soon. You can cancel any time before then.
            </p>
            <button
              onClick={cancel}
              disabled={busy}
              className="mt-2 text-xs text-amber-800 hover:text-amber-900 underline-offset-2 hover:underline"
            >
              Cancel deletion request
            </button>
            {err && <p className="text-xs text-red-600 mt-1.5">{err}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-gray-900">Delete your account</p>
      <p className="text-xs text-gray-500 mt-0.5">
        We&apos;ll queue your account for removal. Your reviews and posts may remain anonymously
        (without your identity attached) so other students don&apos;t lose context.
      </p>
      <button
        onClick={request}
        disabled={busy}
        className="mt-3 text-xs text-red-600 hover:text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
      >
        Request account deletion
      </button>
      {err && <p className="text-xs text-red-600 mt-1.5">{err}</p>}
    </div>
  )
}
