'use client'

import { useState } from 'react'
import { AlertCircle, Loader2, MessageSquarePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          body,
          is_anonymous: isAnonymous,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not add comment.')
      }

      setBody('')
      setIsAnonymous(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Could not add comment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-medium text-gray-900">Add a comment</h2>

      <textarea
        rows={4}
        value={body}
        onChange={event => setBody(event.target.value)}
        placeholder="Add context, answer a question, or point out what changed."
        className="textarea"
      />

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={event => setIsAnonymous(event.target.checked)}
          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        Comment anonymously
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
        disabled={isSubmitting || body.trim().length < 3}
        className="btn-primary"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
        Post comment
      </button>
    </div>
  )
}
