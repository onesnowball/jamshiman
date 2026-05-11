'use client'

import { useState } from 'react'
import { Plus, Check, X, Loader2, ToggleLeft, ToggleRight, Pencil, GraduationCap, AlertTriangle, Trash2 } from 'lucide-react'
import type { Department } from '@/types/database'

type University = { id: string; name: string; domain: string }

interface Props {
  departments: (Department & { universities: { name: string } | null })[]
  universities: University[]
  isGlobalAdmin?: boolean
}

export function AcademicDeptManager({ departments: initial, universities, isGlobalAdmin = false }: Props) {
  const [depts, setDepts] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [createForm, setCreateForm] = useState({ name: '', slug: '' })
  const [editForm, setEditForm] = useState({ name: '', slug: '' })

  const universityId = universities[0]?.id ?? ''

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function openEdit(dept: typeof initial[0]) {
    setEditingId(dept.id)
    setEditForm({ name: dept.name, slug: dept.slug })
    setShowCreate(false)
    setError('')
  }

  async function create() {
    setLoading('create')
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        university_id: universityId,
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        is_board_category: false,
      }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error || 'Failed.'); return }
    const uni = universities[0] ?? null
    setDepts(prev => [...prev, {
      ...data.department,
      universities: uni ? { name: uni.name } : null,
    }])
    setShowCreate(false)
    setCreateForm({ name: '', slug: '' })
  }

  async function save(id: string) {
    setLoading(id)
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editForm.name.trim(), slug: editForm.slug.trim() }),
    })
    setLoading(null)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed.'); return }
    setDepts(prev => prev.map(d => d.id === id ? { ...d, name: editForm.name.trim(), slug: editForm.slug.trim() } : d))
    setEditingId(null)
  }

  async function deleteDept(id: string) {
    setLoading(id + '-delete')
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(null)
    setConfirmDelete(null)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed.'); return }
    setDepts(prev => prev.filter(d => d.id !== id))
  }

  async function toggleActive(dept: typeof initial[0]) {
    const key = dept.id + '-toggle'
    setLoading(key)
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dept.id, active: !dept.active }),
    })
    setLoading(null)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed.'); return }
    setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, active: !d.active } : d))
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-500" />
            Academic Departments
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Used to organise advisors, courses, and dept-specific boards. Hidden departments won't appear in dropdowns.
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null) }}
            className="btn-secondary text-xs py-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add dept
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card p-5 space-y-4 border-brand-200 bg-brand-50/30">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-600" /> New academic department
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1 block">Department name</label>
              <input
                className="input"
                placeholder="e.g. Computer Science"
                value={createForm.name}
                autoFocus
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              />
            </div>
            <div>
              <label className="section-label mb-1 block">Slug</label>
              <input
                className="input font-mono text-sm"
                placeholder="e.g. cs"
                value={createForm.slug}
                onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              />
              <p className="text-xs text-gray-400 mt-1">Used in URLs — lowercase, no spaces</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={loading === 'create' || !createForm.name.trim() || !createForm.slug.trim()}
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
        {depts.length === 0 ? (
          <div className="p-6 text-center">
            <GraduationCap className="w-7 h-7 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No academic departments yet.</p>
            <p className="text-xs text-gray-400 mt-0.5">Add one so admins can attach advisors and courses.</p>
          </div>
        ) : (
          depts.map(dept => (
            <div key={dept.id}>
              {editingId === dept.id ? (
                <div className="px-4 py-4 space-y-3 bg-gray-50/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="section-label mb-1 block">Department name</label>
                      <input
                        className="input"
                        value={editForm.name}
                        autoFocus
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="section-label mb-1 block">Slug</label>
                      <input
                        className="input font-mono text-sm"
                        value={editForm.slug}
                        onChange={e => setEditForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Changing the slug updates all board URLs for this department. Existing bookmarks may break.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => save(dept.id)}
                      disabled={loading === dept.id || !editForm.name.trim() || !editForm.slug.trim()}
                      className="btn-primary text-xs py-1 px-3 disabled:opacity-50"
                    >
                      {loading === dept.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save changes
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1 px-3">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{dept.name}</p>
                        <span className="text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded shrink-0">
                          {dept.slug}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEdit(dept)}
                        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border border-transparent text-gray-400 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all"
                        title="Edit name and slug"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleActive(dept)}
                        disabled={loading === dept.id + '-toggle'}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                          dept.active
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                        }`}
                      >
                        {loading === dept.id + '-toggle'
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : dept.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />
                        }
                        {dept.active ? 'Visible' : 'Hidden'}
                      </button>
                      {isGlobalAdmin && (
                        <button
                          onClick={() => setConfirmDelete(dept.id)}
                          disabled={!!loading}
                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                          title="Delete department"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {confirmDelete === dept.id && (
                    <div className="mx-4 mb-3 p-3 rounded-lg bg-red-50 border border-red-100 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-red-800">Delete "{dept.name}"?</p>
                          <p className="text-xs text-red-600 mt-0.5">
                            Advisors and courses in this department won't be removed, but they'll lose their department association. This cannot be undone.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteDept(dept.id)}
                          disabled={loading === dept.id + '-delete'}
                          className="btn-danger text-xs py-1 px-3"
                        >
                          {loading === dept.id + '-delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Yes, delete
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-xs py-1 px-3">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
