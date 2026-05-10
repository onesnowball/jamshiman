'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import { clsx } from 'clsx'
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
  const [degreeType, setDegreeType] = useState<'ms' | 'phd'>('phd')
  const [semester, setSemester] = useState('Fall 2026')

  const SEMESTER_OPTIONS = (() => {
    const terms = ['Fall', 'Spring-Summer', 'Winter']
    const years = [2026, 2025, 2024, 2023, 2022, 2021]
    return terms.flatMap(term => years.map(year => `${term} ${year}`))
  })()
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
          degree_type: degreeType,
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="section-label">Degree type</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['ms', 'phd'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setDegreeType(type)}
                className={clsx(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  degreeType === type ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="section-label">Semester taken</label>
          <select
            value={semester}
            onChange={event => setSemester(event.target.value)}
            className="input"
          >
            {SEMESTER_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
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
