'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Flag, Loader2, Undo2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { FlagReason } from '@/types/database'
import type { FlagContentType } from '@/lib/content'

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'inappropriate', label: 'Inappropriate or abusive' },
  { value: 'inaccurate',    label: 'Misleading or inaccurate' },
  { value: 'spam',          label: 'Spam or self-promotion' },
  { value: 'harmful',       label: 'Potentially harmful' },
  { value: 'other',         label: 'Other' },
]

export function FlagButton({
  contentType,
  contentId,
  className,
}: {
  contentType: FlagContentType
  contentId: string
  className?: string
}) {
  const [isOpen, setIsOpen]         = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnflagging, setIsUnflagging] = useState(false)
  const [reason, setReason]         = useState<FlagReason>('inappropriate')
  const [notes, setNotes]           = useState('')
  const [error, setError]           = useState('')
  const [reported, setReported]     = useState(false)
  const [canUndo, setCanUndo]       = useState(false)
  const [checked, setChecked]       = useState(false)

  // Check whether this viewer already flagged this content.
  useEffect(() => {
    let cancelled = false
    fetch(`/api/flags?content_type=${contentType}&content_id=${contentId}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        setReported(d.reported ?? false)
        setCanUndo(d.canUndo ?? false)
        setChecked(true)
      })
      .catch(() => setChecked(true))
    return () => { cancelled = true }
  }, [contentType, contentId])

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_id: contentId, reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit report.')
      setReported(true)
      setCanUndo(true)
      setIsOpen(false)
      setNotes('')
    } catch (err: any) {
      setError(err.message || 'Could not submit report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUndo() {
    setIsUnflagging(true)
    try {
      await fetch('/api/flags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_id: contentId }),
      })
      setReported(false)
      setCanUndo(false)
    } finally {
      setIsUnflagging(false)
    }
  }

  // Don't render until we know the flag state (avoids flash)
  if (!checked) return null

  // Already reported
  if (reported) {
    return (
      <span className={clsx('inline-flex items-center gap-1.5 text-xs', className)}>
        <span className="inline-flex items-center gap-1 text-amber-600">
          <Flag className="w-3.5 h-3.5" />
          Reported
        </span>
        {canUndo && (
          <button
            type="button"
            onClick={handleUndo}
            disabled={isUnflagging}
            className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors ml-1"
            title="Undo report"
          >
            {isUnflagging
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <><Undo2 className="w-3 h-3" /><span>Undo</span></>
            }
          </button>
        )}
      </span>
    )
  }

  return (
    <div className={clsx(isOpen ? 'space-y-2' : 'inline-flex', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(c => !c)}
        className="text-xs text-gray-400 hover:text-amber-600 inline-flex items-center gap-1 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {isOpen && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 space-y-3">
          <p className="text-xs font-medium text-amber-800">Why are you reporting this?</p>
          <div className="grid grid-cols-1 gap-1.5">
            {FLAG_REASONS.map(opt => (
              <label
                key={opt.value}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs',
                  reason === opt.value
                    ? 'border-amber-400 bg-amber-100 text-amber-900 font-medium'
                    : 'border-transparent bg-white/70 text-gray-600 hover:bg-white hover:border-amber-200'
                )}
              >
                <input
                  type="radio"
                  name={`flag-reason-${contentId}`}
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value as FlagReason)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>

          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional context for the mod team…"
            className="textarea text-xs"
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {isSubmitting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Flag className="w-3.5 h-3.5" />
              }
              Submit report
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setError('') }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
