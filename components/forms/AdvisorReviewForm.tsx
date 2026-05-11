'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import { clsx } from 'clsx'
import type { Advisor, AdvisorRatings } from '@/types/database'

const RATING_FIELDS: { key: keyof AdvisorRatings; label: string; description: string }[] = [
  { key: 'mentorship',    label: 'Mentorship',        description: 'Guidance, feedback quality, investment in your growth' },
  { key: 'funding',       label: 'Funding reliability', description: 'Consistent RA/TA support, no surprise funding cuts' },
  { key: 'worklife',      label: 'Work-life balance',  description: 'Reasonable expectations, respect for personal time' },
  { key: 'communication', label: 'Communication',      description: 'Availability, responsiveness, clarity of expectations' },
  { key: 'career',        label: 'Career support',     description: 'Connections, letters, job market preparation' },
]

interface Props {
  advisor: Advisor & { dept_name?: string }
  onSuccess?: () => void
}

export function AdvisorReviewForm({ advisor, onSuccess }: Props) {
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [ratings, setRatings] = useState<AdvisorRatings>({
    mentorship: 0, funding: 0, worklife: 0, communication: 0, career: 0,
  })
  const [isLabMember, setIsLabMember] = useState<boolean | null>(null)
  const [originalText, setOriginalText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showTips, setShowTips] = useState(false)

  const allRated = Object.values(ratings).every(v => v > 0)
  const canSubmit = originalText.trim().length >= 50

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisor_id: advisor.id,
          is_lab_member: isLabMember,
          ratings,
          original_text: originalText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('done')
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <h3 className="text-lg font-medium text-gray-900">Review submitted</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Thank you. Your review will appear publicly once 3 or more reviews exist for this advisor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Advisor header */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm flex-shrink-0">
          {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{advisor.name}</h3>
          <p className="text-sm text-gray-500">{advisor.dept_name || 'Mechanical Engineering'}</p>
          {advisor.lab_name && (
            <p className="text-xs text-gray-400 mt-0.5">{advisor.lab_name}</p>
          )}
        </div>
      </div>

      {step === 'form' && (
        <>
          {/* Lab membership — optional */}
          <div className="space-y-2">
            <label className="section-label">Your relationship (optional)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLabMember(prev => prev === true ? null : true)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                  isLabMember === true
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                )}
              >
                <span className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                  isLabMember === true ? 'bg-white border-white' : 'border-gray-300'
                )}>
                  {isLabMember === true && (
                    <svg className="w-3 h-3 text-brand-600" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                Lab member
              </button>
              <p className="text-xs text-gray-400">Were / are a member of this advisor's lab</p>
            </div>
            {isLabMember === null && (
              <p className="text-xs text-gray-400 italic">Leave blank if you prefer not to say</p>
            )}
          </div>

          {/* Ratings */}
          <div className="space-y-3">
            <div className="section-label">Ratings</div>
            {RATING_FIELDS.map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-700">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{description}</div>
                </div>
                <StarRating
                  value={ratings[key]}
                  onChange={v => setRatings(prev => ({ ...prev, [key]: v }))}
                  size="md"
                />
              </div>
            ))}
          </div>

          {/* Written review */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="section-label">Written review</label>
              <button
                onClick={() => setShowTips(!showTips)}
                className="text-xs text-brand-600 flex items-center gap-1"
              >
                Writing tips
                {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showTips && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
                <p>• Describe specific experiences, not just emotions</p>
                <p>• Mention mentorship style, meeting frequency, feedback quality</p>
                <p>• Comment on funding situation and lab culture</p>
                <p>• Share what you wish you knew before joining</p>
                <p>• Avoid naming specific students or highly identifying situations</p>
              </div>
            )}

            <textarea
              rows={6}
              placeholder="Share your honest experience working with this advisor. Include details about mentorship style, lab culture, funding reliability, and anything else future students should know. Min 50 characters."
              value={originalText}
              onChange={e => setOriginalText(e.target.value)}
              className="textarea"
            />
            <div className={clsx(
              'text-xs text-right transition-colors',
              originalText.length < 50 ? 'text-gray-300' : 'text-gray-400'
            )}>
              {originalText.length} chars {originalText.length < 50 && `(need ${50 - originalText.length} more)`}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allRated || !canSubmit || isSubmitting}
            className="btn-primary w-full justify-center py-2.5"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : (
              'Submit review'
            )}
          </button>

          {!allRated && (
            <p className="text-xs text-center text-gray-400">Rate all 5 categories to continue</p>
          )}
        </>
      )}
    </div>
  )
}
