'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { RollingNumber } from '@/components/ui/RollingNumber'
import { ContributionCelebration } from '@/components/brand/ContributionCelebration'

export function AdvisorReviewRequestButton({ advisorId }: { advisorId: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [requested, setRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    fetch(`/api/advisors/${advisorId}/request-review`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setCount(d.count ?? 0); setRequested(!!d.requested) } })
      .catch(() => {})
  }, [advisorId])

  async function onClick() {
    if (busy || requested) return
    setBusy(true)
    // optimistic
    setCount(c => (c ?? 0) + 1)
    setRequested(true)
    const res = await fetch(`/api/advisors/${advisorId}/request-review`, { method: 'POST' })
    setBusy(false)
    if (!res.ok) {
      setRequested(false)
      setCount(c => (c ?? 1) - 1)
      return
    }
    const d = await res.json().catch(() => ({}))
    if (typeof d?.count === 'number') setCount(d.count)
    setCelebrate(true)
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={busy || requested}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all active:scale-[0.97] ${
          requested
            ? 'bg-brand-50 border-brand-200 text-brand-700 cursor-default'
            : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-700'
        }`}
        aria-label="Request a review for this advisor"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{requested ? 'Requested ✨' : 'Request a review'}</span>
        {count != null && (
          <span className="ml-1 text-xs text-gray-500">
            (<RollingNumber value={count} />)
          </span>
        )}
      </button>
      <ContributionCelebration
        show={celebrate}
        message="Request added ✨ We'll show future students that people want more info here."
        onDone={() => setCelebrate(false)}
      />
    </>
  )
}
