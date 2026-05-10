'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

export function MessageCompose({ recipientId }: { recipientId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!body.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId, body: body.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Could not send.')
      }
      setBody('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2 items-end">
        <textarea
          rows={2}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a message… (Enter to send)"
          className="textarea flex-1 resize-none"
        />
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="btn-primary py-2 px-3 disabled:opacity-50 flex-shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
