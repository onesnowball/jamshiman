'use client'

import { useState } from 'react'
import { AtSign, CheckCircle2, Loader2, AlertCircle, Pencil } from 'lucide-react'

export function HandleEditor({ currentHandle }: { currentHandle: string | null }) {
  const [editing, setEditing] = useState(false)
  const [handle, setHandle] = useState(currentHandle ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const trimmed = handle.trim().toLowerCase()
    try {
      const res = await fetch('/api/profile/handle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not save handle. Try another.')
        return
      }
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <AtSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono font-medium">
            {currentHandle ?? <span className="text-gray-400 italic">not set</span>}
          </span>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <button
          onClick={() => { setEditing(true); setSaved(false) }}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          {currentHandle ? 'Change' : 'Set handle'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 flex-wrap">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
        <input
          type="text"
          value={handle}
          onChange={e => setHandle(e.target.value.replace(/[^a-z0-9_]/g, '').slice(0, 20))}
          placeholder="your_handle"
          className="input text-sm pl-6 py-1.5 w-44"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          minLength={3}
          maxLength={20}
        />
      </div>
      <button
        type="submit"
        disabled={saving || handle.length < 3}
        className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => { setEditing(false); setHandle(currentHandle ?? ''); setError('') }}
        className="btn-secondary text-xs py-1.5 px-3"
      >
        Cancel
      </button>
      {error && (
        <div className="w-full flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </form>
  )
}
