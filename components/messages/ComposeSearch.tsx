'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, MessageSquare } from 'lucide-react'

type Contact = { id: string; handle: string }

export function ComposeSearch({ contacts }: { contacts: Contact[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? contacts.filter(c => c.handle.toLowerCase().includes(query.toLowerCase()))
    : contacts

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">New message</h1>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by handle…"
          className="input pl-9"
        />
      </div>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-700">No one to message yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            You can message students who post non-anonymously on the boards.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-400">No matches for "{query}"</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50 overflow-hidden">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold flex-shrink-0">
                {c.handle.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{c.handle}</p>
                <p className="text-xs text-gray-400">Tap to start chatting</p>
              </div>
              <MessageSquare className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
