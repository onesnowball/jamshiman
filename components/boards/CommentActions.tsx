'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react'

export function CommentActions({
  commentId,
  initialBody,
}: {
  commentId: string
  initialBody: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'editing' | 'deleting'>('idle')
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return
    setMode('deleting')
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleSave() {
    if (body.trim() === initialBody.trim()) { setMode('idle'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
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
      <div className="space-y-2 pt-1">
        <textarea
          rows={3}
          value={body}
          onChange={e => setBody(e.target.value)}
          className="textarea w-full text-sm"
          autoFocus
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || body.trim().length < 3}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
          <button
            onClick={() => { setBody(initialBody); setMode('idle') }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        onClick={() => setMode('editing')}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={mode === 'deleting'}
        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {mode === 'deleting' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        Delete
      </button>
    </div>
  )
}
