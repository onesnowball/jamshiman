'use client'

import { useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import type { Course, Department } from '@/types/database'

type CourseWithDept = Course & { departments: { name: string } | null }

const BOARD_SLUGS = new Set(['general', 'career', 'housing', 'research', 'wellbeing', 'marketplace'])

interface Props {
  courses: CourseWithDept[]
  departments: Department[]
}

export function CourseAdminManager({ courses: initial, departments: allDepartments }: Props) {
  // Courses belong to academic departments only — exclude board topic slugs
  const departments = allDepartments.filter(d => !BOARD_SLUGS.has(d.slug))
  const [courses, setCourses] = useState<CourseWithDept[]>(initial)
  const [editing, setEditing] = useState<CourseWithDept | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const blank = {
    dept_id: departments[0]?.id ?? '',
    code: '',
    name: '',
    credits: '' as string | number,
  }
  const [form, setForm] = useState(blank)

  function startCreate() {
    setForm(blank)
    setEditing(null)
    setCreating(true)
    setError(null)
  }

  function startEdit(c: CourseWithDept) {
    setForm({ dept_id: c.dept_id, code: c.code, name: c.name, credits: c.credits ?? '' })
    setEditing(c)
    setCreating(false)
    setError(null)
  }

  function cancel() {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  async function submit() {
    setLoading(true)
    setError(null)

    const payload = {
      ...(editing ? { id: editing.id } : {}),
      dept_id: form.dept_id,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      credits: form.credits === '' ? null : Number(form.credits),
    }

    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch('/api/admin/courses', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
      return
    }

    if (editing) {
      const dept = departments.find(d => d.id === form.dept_id) ?? null
      setCourses(prev => prev.map(c =>
        c.id === editing.id
          ? { ...c, ...payload, departments: dept ? { name: dept.name } : null }
          : c
      ))
    } else {
      const dept = departments.find(d => d.id === form.dept_id) ?? null
      setCourses(prev => [
        { ...json.course, departments: dept ? { name: dept.name } : null },
        ...prev,
      ])
    }

    cancel()
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course? This will also remove all reviews and discussions tied to it.')) return
    setLoading(true)
    const res = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? 'Could not delete.')
      return
    }
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const isOpen = creating || editing !== null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{courses.length} course{courses.length === 1 ? '' : 's'} in catalog</p>
        {!isOpen && (
          <button onClick={startCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add course
          </button>
        )}
      </div>

      {isOpen && (
        <div className="card p-5 space-y-4 border-brand-200">
          <h3 className="font-medium text-gray-900">{editing ? 'Edit course' : 'New course'}</h3>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1">Department</label>
              <select
                className="input"
                value={form.dept_id}
                onChange={e => setForm(f => ({ ...f, dept_id: e.target.value }))}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-label mb-1">Course code</label>
              <input
                className="input"
                placeholder="e.g. ME 501"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="section-label mb-1">Course name</label>
              <input
                className="input"
                placeholder="e.g. Advanced Thermodynamics"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="section-label mb-1">Credits (optional)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={12}
                placeholder="3"
                value={form.credits}
                onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={loading || !form.code.trim() || !form.name.trim() || !form.dept_id}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editing ? 'Save changes' : 'Create course'}
            </button>
            <button onClick={cancel} className="btn-secondary flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {!courses.length ? (
        <div className="card p-10 text-center text-gray-400">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No courses yet. Add the first one or run the seed SQL.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {courses.map(course => (
            <div key={course.id} className="flex items-center justify-between p-4 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{course.code}</p>
                <p className="text-sm text-gray-700 truncate">{course.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {course.departments?.name ?? '—'}
                  {course.credits ? ` · ${course.credits} cr` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(course)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
