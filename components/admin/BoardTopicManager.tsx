'use client'

import { useState } from 'react'
import { Plus, Check, X, Loader2, ToggleLeft, ToggleRight, Trash2, AlertTriangle, Hash } from 'lucide-react'
import type { Department } from '@/types/database'

type University = { id: string; name: string; domain: string }

interface Props {
  departments: (Department & { universities: { name: string } | null })[]
  universities: University[]
}

export function BoardTopicManager({ departments: initial, universities }: Props) {
  const [topics, setTopics] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', slug: '' })

  const universityId = universities[0]?.id ?? ''

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function create() {
    setLoading('create')
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        university_id: universityId,
        name: form.name.trim(),
        slug: form.slug.trim(),
        is_board_category: true,
      }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error || 'Failed.'); return }
    const uni = universities[0] ?? null
    setTopics(prev => [...prev, {
      ...data.department,
      universities: uni ? { name: uni.name } : null,
    }])
    setShowCreate(false)
    setForm({ name: '', slug: '' })
  }

  async function toggleActive(topic: typeof initial[0]) {
    const key = topic.id + '-toggle'
    setLoading(key)
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: topic.id, active: !topic.active }),
    })
    setLoading(null)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed.'); return }
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, active: !t.active } : t))
  }

  async function deleteTopic(id: string) {
    setLoading(id)
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(null)
    setConfirmDelete(null)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed.'); return }
    setTopics(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-500" />
            Community Board Topics
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Topic filters on the boards page. <strong>General</strong> is protected — it's the landing zone when other topics are deleted.
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-secondary text-xs py-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add topic
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card p-5 space-y-4 border-brand-200 bg-brand-50/30">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-600" /> New community board topic
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1 block">Topic name</label>
              <input
                className="input"
                placeholder="e.g. Internships"
                value={form.name}
                autoFocus
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              />
            </div>
            <div>
              <label className="section-label mb-1 block">Slug</label>
              <input
                className="input font-mono text-sm"
                placeholder="e.g. internships"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              />
              <p className="text-xs text-gray-400 mt-1">Appears as #slug in boards</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={loading === 'create' || !form.name.trim() || !form.slug.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {loading === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden divide-y divide-gray-50">
        {topics.length === 0 ? (
          <div className="p-6 text-center">
            <Hash className="w-7 h-7 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No board topics yet.</p>
          </div>
        ) : (
          topics.map(topic => {
            const isGeneral = topic.slug === 'general'
            const isConfirming = confirmDelete === topic.id
            return (
              <div key={topic.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{topic.name}</p>
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded shrink-0">
                        #{topic.slug}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(topic)}
                      disabled={loading === topic.id + '-toggle'}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                        topic.active
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                      }`}
                    >
                      {loading === topic.id + '-toggle'
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : topic.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />
                      }
                      {topic.active ? 'Visible' : 'Hidden'}
                    </button>
                    {!isGeneral ? (
                      <button
                        onClick={() => setConfirmDelete(topic.id)}
                        disabled={loading === topic.id}
                        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                        title="Delete this board topic"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 px-2">Protected</span>
                    )}
                  </div>
                </div>

                {isConfirming && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-red-800">Delete "{topic.name}"?</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          All posts in this topic will be moved to <strong>General</strong> automatically. This cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        disabled={loading === topic.id}
                        className="btn-danger text-xs py-1 px-3"
                      >
                        {loading === topic.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Yes, delete & move posts
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
