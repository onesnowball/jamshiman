'use client'

import { useState } from 'react'
import { AlertCircle, Loader2, Send } from 'lucide-react'

export function NewCourseThreadForm({
  courseId,
  courseCode,
}: {
  courseId: string
  courseCode: string
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          title,
          body,
          is_anonymous: isAnonymous,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not create thread.')
      }

      setTitle('')
      setBody('')
      setIsAnonymous(true)
      window.location.href = data.postUrl
    } catch (err: any) {
      setError(err.message || 'Could not create thread.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-medium text-gray-900">Start a class thread</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ask about workload, share exam survival tips, or find classmates taking {courseCode}.
        </p>
      </div>

      <input
        value={title}
        onChange={event => setTitle(event.target.value)}
        placeholder="Thread title"
        className="input"
      />

      <textarea
        rows={5}
        value={body}
        onChange={event => setBody(event.target.value)}
        placeholder="What do you want to ask or share about this course?"
        className="textarea"
      />

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={event => setIsAnonymous(event.target.checked)}
          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        Post anonymously
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || title.trim().length < 4 || body.trim().length < 20}
        className="btn-primary"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Publish thread
      </button>
    </div>
  )
}
