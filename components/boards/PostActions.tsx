'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react'

export function PostActions({
  postId,
  initialTitle,
  initialBody,
  redirectTo = '/boards',
}: {
  postId: string
  initialTitle: string
  initialBody: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'editing' | 'deleting'>('idle')
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setMode('deleting')
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push(redirectTo)
      router.refresh()
    } else {
      setMode('idle')
      alert('Could not delete post.')
    }
  }

  async function handleSave() {
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (trimmedTitle === initialTitle && trimmedBody === initialBody) {
      setMode('idle')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmedTitle, body: trimmedBody }),
    })
    if (res.ok) {
      setSaving(false)
      setMode('idle')
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error || 'Could not save.')
      setSaving(false)
    }
  }

  if (mode === 'editing') {
    return (
      <div className="space-y-3 pt-1">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input text-sm font-medium"
          placeholder="Post title"
          maxLength={120}
          autoFocus
        />
        <textarea
          rows={6}
          value={body}
          onChange={e => setBody(e.target.value)}
          className="textarea text-sm"
          placeholder="Post body"
          maxLength={5000}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || title.trim().length < 4 || body.trim().length < 10}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
          <button
            onClick={() => { setTitle(initialTitle); setBody(initialBody); setMode('idle'); setError('') }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setMode('editing')}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={mode === 'deleting'}
        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        {mode === 'deleting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        Delete
      </button>
    </div>
  )
}
