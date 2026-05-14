'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, ShieldCheck } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import { ContributionCelebration } from '@/components/brand/ContributionCelebration'
import { clsx } from 'clsx'
import type { Advisor, AdvisorRatings } from '@/types/database'

const RATING_FIELDS: { key: keyof AdvisorRatings; label: string; description: string }[] = [
  { key: 'mentorship',     label: 'Mentorship',       description: 'Guidance, feedback quality, investment in your growth' },
  { key: 'funding',        label: 'Funding',           description: 'Consistent RA/TA support, no surprise funding cuts' },
  { key: 'worklife',       label: 'Work-life balance', description: 'Reasonable expectations, respect for personal time' },
  { key: 'communication',  label: 'Communication',     description: 'Availability, responsiveness, clarity of expectations' },
  { key: 'career',         label: 'Career support',    description: 'Connections, letters, job market preparation' },
  { key: 'lab_atmosphere', label: 'Lab atmosphere',    description: 'Team culture, collaboration, inclusivity, day-to-day environment' },
]

type Relationship = 'current_lab' | 'former_lab' | 'collaborator' | 'course_student' | 'committee' | 'prefer_not'

const RELATIONSHIP_OPTIONS: { value: Relationship; label: string }[] = [
  { value: 'current_lab',    label: 'Current lab member' },
  { value: 'former_lab',     label: 'Former lab member' },
  { value: 'collaborator',   label: 'Collaborator' },
  { value: 'course_student', label: 'Course student' },
  { value: 'committee',      label: 'Committee student' },
  { value: 'prefer_not',     label: 'Prefer not to say' },
]

function relationshipToIsLabMember(rel: Relationship | null): boolean | null {
  if (rel === 'current_lab' || rel === 'former_lab' || rel === 'collaborator') return true
  if (rel === 'course_student' || rel === 'committee') return false
  return null
}

interface Props {
  advisor: Advisor & { dept_name?: string }
  onSuccess?: () => void
}

export function AdvisorReviewForm({ advisor, onSuccess }: Props) {
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [ratings, setRatings] = useState<AdvisorRatings>({
    mentorship: 0, funding: 0, worklife: 0, communication: 0, career: 0, lab_atmosphere: 0,
  })
  const [relationship, setRelationship] = useState<Relationship | null>(null)
  const [originalText, setOriginalText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showTips, setShowTips] = useState(false)

  const allRated = RATING_FIELDS.every(f => (ratings[f.key] ?? 0) > 0)
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
          is_lab_member: relationshipToIsLabMember(relationship),
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
      <>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">Review submitted</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Thank you. Your review will appear once enough reviews exist for this advisor.
          </p>
        </div>
        <ContributionCelebration show message="You helped future students make a better decision ✨" />
      </>
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
          <p className="text-sm text-gray-500">{advisor.dept_name}</p>
          {advisor.lab_name && (
            <p className="text-xs text-gray-400 mt-0.5">{advisor.lab_name}</p>
          )}
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        Your identity is not shown publicly. Avoid details that could identify you or others.
      </div>

      {/* Relationship */}
      <div className="space-y-2">
        <label className="section-label">Your relationship (optional)</label>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRelationship(prev => prev === opt.value ? null : opt.value)}
              className={clsx(
                'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                relationship === opt.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
              value={ratings[key] ?? 0}
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
          placeholder="Share what future students should know: mentorship style, lab culture, funding reliability, expectations, communication, and overall environment. Be honest, but useful."
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
        <p className="text-xs text-center text-gray-400">Rate all {RATING_FIELDS.length} categories to continue</p>
      )}
    </div>
  )
}
