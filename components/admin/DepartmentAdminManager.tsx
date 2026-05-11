'use client'

import { useState } from 'react'
import { Plus, Check, X, Loader2, ToggleLeft, ToggleRight, Info } from 'lucide-react'
import type { Department } from '@/types/database'

type University = { id: string; name: string; domain: string }

const BOARD_SLUGS = ['general', 'career', 'housing', 'research', 'wellbeing', 'marketplace']

interface Props {
  departments: (Department & { universities: { name: string } | null })[]
  universities: University[]
  isGlobalAdmin: boolean
}

export function DepartmentAdminManager({ departments: initial, universities, isGlobalAdmin }: Props) {
  const [depts, setDepts] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    university_id: universities[0]?.id ?? '',
    name: '',
    slug: '',
  })

  // University is always pre-set — only show the picker if somehow multiple
  // universities are passed (shouldn't happen with current admin-context scoping)
  const showUniversityPicker = universities.length > 1

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function create() {
    setLoading('create')
    setError('')
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error || 'Failed.'); return }
    const uni = universities.find(u => u.id === form.university_id) ?? null
    setDepts(prev => [...prev, { ...data.department, universities: uni ? { name: uni.name } : null }])
    setCreating(false)
    setForm({ university_id: universities[0]?.id ?? '', name: '', slug: '' })
  }

  async function toggleActive(dept: typeof initial[0]) {
    setLoading(dept.id)
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

  const boardDepts = depts.filter(d => BOARD_SLUGS.includes(d.slug))
  const academicDepts = depts.filter(d => !BOARD_SLUGS.includes(d.slug))

  const DeptRow = ({ dept }: { dept: typeof initial[0] }) => (
    <div className="flex items-center justify-between p-4 gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{dept.name}</p>
          <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{dept.slug}</span>
        </div>
      </div>
      <button
        onClick={() => toggleActive(dept)}
        disabled={loading === dept.id}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
          dept.active
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-700'
        }`}
      >
        {loading === dept.id
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : dept.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />
        }
        {dept.active ? 'Visible' : 'Hidden'}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Create form */}
      {creating ? (
        <div className="card p-5 space-y-4 border-brand-200">
          <h3 className="font-medium text-gray-900">New academic department</h3>

          {showUniversityPicker && (
            <div>
              <label className="section-label mb-1">University</label>
              <select className="input" value={form.university_id} onChange={e => setForm(f => ({ ...f, university_id: e.target.value }))}>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1">Department name</label>
              <input
                className="input"
                placeholder="e.g. Neuroscience"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              />
            </div>
            <div>
              <label className="section-label mb-1">Slug</label>
              <input
                className="input font-mono text-sm"
                placeholder="e.g. neuroscience"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              />
              <p className="text-xs text-gray-400 mt-1">Appears in URLs — lowercase letters only, no spaces</p>
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
            <button onClick={() => setCreating(false)} className="btn-secondary text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New department
        </button>
      )}

      {/* Academic departments */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700 text-sm">Academic departments</h3>
        <p className="text-xs text-gray-400">Used for organizing advisors, courses, and department-specific boards.</p>
        <div className="card divide-y divide-gray-50">
          {academicDepts.length === 0
            ? <p className="text-sm text-gray-400 p-4">No academic departments yet. Add one above.</p>
            : academicDepts.map(d => <DeptRow key={d.id} dept={d} />)
          }
        </div>
      </div>

      {/* Board categories */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-700 text-sm">Community board topics</h3>
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-1 w-64 bg-gray-900 text-white text-xs rounded-lg p-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              These are the topic filter chips on the community boards page (General, Career, Housing…). Toggle visibility to show or hide a topic without deleting it.
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">Toggle visibility to show or hide a topic on the boards page.</p>
        <div className="card divide-y divide-gray-50">
          {boardDepts.length === 0
            ? <p className="text-sm text-gray-400 p-4">None set up yet.</p>
            : boardDepts.map(d => <DeptRow key={d.id} dept={d} />)
          }
        </div>
      </div>
    </div>
  )
}
