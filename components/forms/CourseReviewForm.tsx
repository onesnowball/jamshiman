'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, ShieldCheck } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import type { Course, CourseRatings } from '@/types/database'

const RATING_FIELDS: { key: keyof CourseRatings; label: string; description: string }[] = [
  { key: 'difficulty', label: 'Difficulty', description: 'How demanding the class felt week to week.' },
  { key: 'usefulness', label: 'Usefulness', description: 'How valuable the material felt for your research or degree.' },
  { key: 'workload', label: 'Workload', description: 'How manageable the pacing, projects, and reading were.' },
  { key: 'professor', label: 'Instruction', description: 'Clarity, responsiveness, and overall teaching quality.' },
]

export function CourseReviewForm({
  course,
}: {
  course: Course & { dept_name?: string }
}) {
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [semester, setSemester] = useState('')
  const [ratings, setRatings] = useState<CourseRatings>({
    difficulty: 0,
    usefulness: 0,
    workload: 0,
    professor: 0,
  })
  const [originalText, setOriginalText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allRated = Object.values(ratings).every(value => value > 0)
  const canSubmit = originalText.trim().length >= 1 && semester.length >= 4

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/course-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          semester,
          ratings,
          original_text: originalText,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.')
      }

      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <h3 className="text-lg font-medium text-gray-900">Course review submitted</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Thanks for sharing your experience with this course.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900">{course.code}</h3>
        <p className="text-sm text-gray-500">{course.name}</p>
        <p className="text-xs text-gray-400 mt-1">{course.dept_name}</p>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        Your identity is not shown publicly. Avoid details that could identify you or others.
      </div>

      <div className="space-y-1.5">
        <label className="section-label">Semester taken</label>
        <input
          type="text"
          value={semester}
          onChange={event => setSemester(event.target.value)}
          placeholder="e.g. Fall 2025"
          className="input"
        />
      </div>

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
              onChange={value => setRatings(current => ({ ...current, [key]: value }))}
              size="md"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="section-label">Written review</label>
        <textarea
          rows={6}
          value={originalText}
          onChange={event => setOriginalText(event.target.value)}
          placeholder="Share what the workload, instruction quality, and value of this course were actually like."
          className="textarea"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allRated || !canSubmit || isSubmitting}
        className="btn-primary w-full justify-center py-2.5"
      >
        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit course review'}
      </button>
    </div>
  )
}
