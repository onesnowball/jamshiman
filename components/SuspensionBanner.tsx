'use client'

import { useState } from 'react'
import { ShieldOff, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react'

export function SuspensionBanner() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function submitAppeal() {
    if (reason.trim().length < 10) {
      setError('Please write at least 10 characters explaining your situation.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit appeal.')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-red-600 text-white">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldOff className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium truncate">
            Your account has been suspended. You can read content but cannot post or interact.
          </p>
        </div>
        {!submitted ? (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors flex-shrink-0"
          >
            Appeal
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full flex-shrink-0">
            <CheckCircle className="w-3 h-3" /> Appeal sent
          </span>
        )}
      </div>

      {open && !submitted && (
        <div className="border-t border-red-500/50 bg-red-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
            <p className="text-xs text-red-100">
              If you believe this suspension is a mistake, explain your situation below. A global admin will review your appeal.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={e => { setReason(e.target.value); setError('') }}
              placeholder="Describe why you think this suspension is incorrect…"
              className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border-0 outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400 resize-none"
            />
            {error && <p className="text-xs text-red-200">{error}</p>}
            <div className="flex justify-end">
              <button
                onClick={submitAppeal}
                disabled={loading || reason.trim().length < 10}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white text-red-700 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Submit appeal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
