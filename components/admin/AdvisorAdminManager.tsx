'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Plus, UserCog } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatAdvisorDepartmentLine } from '@/lib/advisor-departments'
import type { Advisor, Department } from '@/types/database'

type AdvisorRecord = Advisor & {
  departments: { name: string | null } | null
  additional_dept_ids?: string[]
}

function defaultDeptId(departments: Department[]) {
  return departments.find(d => d.active)?.id ?? departments[0]?.id ?? ''
}

function formatApiError(data: { error?: unknown }): string {
  const e = data?.error
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    try {
      return JSON.stringify(e)
    } catch {
      return 'Invalid request.'
    }
  }
  return 'Request failed.'
}

const emptyForm = {
  id: '',
  dept_id: '',
  name: '',
  title: '',
  lab_name: '',
  research_areas: '',
  active: true,
  additional_dept_ids: [] as string[],
}

export function AdvisorAdminManager({
  advisors,
  departments,
  schoolSlug = '',
}: {
  advisors: AdvisorRecord[]
  departments: Department[]
  schoolSlug?: string
}) {

  const router = useRouter()
  const [form, setForm] = useState({
    ...emptyForm,
    dept_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (form.id) return
    const valid = departments.some(d => d.id === form.dept_id)
    if (valid) return
    const next = defaultDeptId(departments)
    setForm(f => (f.dept_id === next ? f : { ...f, dept_id: next }))
  }, [departments, form.id, form.dept_id])

  useEffect(() => {
    setForm(f => {
      const filtered = f.additional_dept_ids.filter(id => id !== f.dept_id)
      if (filtered.length === f.additional_dept_ids.length) return f
      return { ...f, additional_dept_ids: filtered }
    })
  }, [form.dept_id])

  const departmentMap = useMemo(
    () => new Map(departments.map(department => [department.id, department.name])),
    [departments]
  )

  async function handleSubmit() {
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        research_areas: form.research_areas
          .split(',')
          .map(area => area.trim())
          .filter(Boolean),
        additional_dept_ids: form.additional_dept_ids.filter(id => id && id !== form.dept_id),
      }

      const response = await fetch('/api/admin/advisors', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(formatApiError(data))

      setForm({
        ...emptyForm,
        dept_id: defaultDeptId(departments),
        additional_dept_ids: [],
      })
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Could not save advisor.')
    } finally {
      setSaving(false)
    }
  }

  function loadAdvisor(advisor: AdvisorRecord) {
    setForm({
      id: advisor.id,
      dept_id: advisor.dept_id,
      name: advisor.name,
      title: advisor.title ?? '',
      lab_name: advisor.lab_name ?? '',
      research_areas: advisor.research_areas.join(', '),
      active: advisor.active,
      additional_dept_ids: [...(advisor.additional_dept_ids ?? [])],
    })
  }

  function toggleAdditionalDept(deptId: string) {
    setForm(f => {
      const next = new Set(f.additional_dept_ids)
      if (next.has(deptId)) next.delete(deptId)
      else next.add(deptId)
      return { ...f, additional_dept_ids: Array.from(next) }
    })
  }

  async function toggleActive(advisor: AdvisorRecord) {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/advisors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: advisor.id,
          dept_id: advisor.dept_id,
          name: advisor.name,
          title: advisor.title ?? '',
          lab_name: advisor.lab_name ?? '',
          research_areas: advisor.research_areas,
          active: !advisor.active,
          additional_dept_ids: advisor.additional_dept_ids ?? [],
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(formatApiError(data))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Could not update advisor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-brand-600" />
          <h2 className="font-medium text-gray-900">
            {form.id ? 'Edit advisor' : 'Add advisor'}
          </h2>
        </div>

        <select
          value={form.dept_id}
          onChange={event => setForm(current => ({ ...current, dept_id: event.target.value }))}
          className="input"
          disabled={!departments.length}
        >
          {departments.map(department => (
            <option key={department.id} value={department.id}>
              {department.name}
              {!department.active ? ' (hidden — enable under Departments)' : ''}
            </option>
          ))}
        </select>

        {departments.length === 0 && schoolSlug && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Add at least one academic department first, then come back here to attach advisors.{' '}
            <Link href={`/${schoolSlug}/admin/departments`} className="font-medium text-brand-700 underline">
              Open Departments admin
            </Link>
          </p>
        )}

        {departments.length > 0 && !departments.some(d => d.active) && (
          <p className="text-xs text-amber-700">
            Every department is hidden from students. Turn at least one to &quot;Visible&quot; so it appears on the
            Departments tab; you can still create advisors now.
          </p>
        )}

        {departments.filter(d => d.id !== form.dept_id).length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-600">Also appointed in (optional)</legend>
            <p className="text-[11px] text-gray-400">Cross-department or courtesy appointments — shown on each department&apos;s page.</p>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-100 rounded-lg p-2 bg-white">
              {departments
                .filter(d => d.id !== form.dept_id)
                .map(d => (
                  <label key={d.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      checked={form.additional_dept_ids.includes(d.id)}
                      onChange={() => toggleAdditionalDept(d.id)}
                    />
                    <span>{d.name}</span>
                    {!d.active && <span className="text-[10px] text-gray-400">(hidden)</span>}
                  </label>
                ))}
            </div>
          </fieldset>
        )}

        <input
          value={form.name}
          onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
          placeholder="Advisor name"
          className="input"
        />
        <input
          value={form.title}
          onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
          placeholder="Title"
          className="input"
        />
        <input
          value={form.lab_name}
          onChange={event => setForm(current => ({ ...current, lab_name: event.target.value }))}
          placeholder="Lab name"
          className="input"
        />
        <textarea
          value={form.research_areas}
          onChange={event => setForm(current => ({ ...current, research_areas: event.target.value }))}
          placeholder="Research areas, comma separated"
          rows={4}
          className="textarea"
        />

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.active}
            onChange={event => setForm(current => ({ ...current, active: event.target.checked }))}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Active listing
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || form.name.trim().length < 3 || !form.dept_id}
            className="btn-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {form.id ? 'Save advisor' : 'Create advisor'}
          </button>

          {form.id && (
            <button
              type="button"
              onClick={() => setForm({ ...emptyForm, dept_id: defaultDeptId(departments), additional_dept_ids: [] })}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {advisors.map(advisor => (
          <div key={advisor.id} className="card p-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{advisor.name}</h3>
                <span className={advisor.active ? 'badge-green' : 'badge-gray'}>
                  {advisor.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatAdvisorDepartmentLine(
                  departmentMap.get(advisor.dept_id) ?? advisor.departments?.name ?? null,
                  (advisor.additional_dept_ids ?? []).map(id => departmentMap.get(id) ?? '').filter(Boolean)
                )}
                {advisor.title ? ` · ${advisor.title}` : ''}
              </p>
              {advisor.lab_name && <p className="text-xs text-gray-400 mt-1">{advisor.lab_name}</p>}
              {advisor.research_areas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {advisor.research_areas.map(area => (
                    <span key={area} className="badge-gray">{area}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => loadAdvisor(advisor)} className="btn-secondary text-xs">
                Edit
              </button>
              <button type="button" onClick={() => toggleActive(advisor)} className="btn-secondary text-xs">
                {advisor.active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
