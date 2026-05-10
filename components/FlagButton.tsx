'use client'

import { useState } from 'react'
import { AlertCircle, Flag, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { FlagReason } from '@/types/database'
import type { FlagContentType } from '@/lib/content'

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'inappropriate', label: 'Inappropriate or abusive' },
  { value: 'inaccurate', label: 'Misleading or inaccurate' },
  { value: 'spam', label: 'Spam or self-promotion' },
  { value: 'harmful', label: 'Potentially harmful' },
  { value: 'other', label: 'Other' },
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
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState<FlagReason>('inappropriate')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          notes,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not submit report.')
      }

      setSubmitted(true)
      setIsOpen(false)
      setNotes('')
    } catch (err: any) {
      setError(err.message || 'Could not submit report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <span className={clsx('inline-flex items-center gap-1 text-xs text-amber-700', className)}>
        <Flag className="w-3.5 h-3.5" />
        Reported
      </span>
    )
  }

  return (
    <div className={clsx('space-y-2', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(current => !current)}
        className="text-xs text-gray-400 hover:text-amber-700 inline-flex items-center gap-1"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {isOpen && (
        <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3 space-y-3">
          <select
            value={reason}
            onChange={event => setReason(event.target.value as FlagReason)}
            className="input"
          >
            {FLAG_REASONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <textarea
            rows={3}
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Optional notes for the moderation team"
            className="textarea"
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-secondary text-xs py-1.5"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
              Submit report
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
