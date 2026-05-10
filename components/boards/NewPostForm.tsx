'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Send } from 'lucide-react'
import type { Department } from '@/types/database'

export function NewPostForm({ departments }: { departments: Department[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [deptId, setDeptId] = useState(departments[0]?.id ?? '')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept_id: deptId, title, body, is_anonymous: isAnonymous }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not post.')
      window.location.href = data.postUrl
    } catch (err: any) {
      setError(err.message || 'Could not post.')
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="space-y-1.5">
        <label className="section-label">Board</label>
        <select value={deptId} onChange={e => setDeptId(e.target.value)} className="input">
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="section-label">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What do you want to ask or share?"
          className="input"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="section-label">Body</label>
        <textarea
          rows={6}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Give context, share details, or just ask the question..."
          className="textarea"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={e => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Post anonymously
        </label>

        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || title.trim().length < 4 || body.trim().length < 10}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
