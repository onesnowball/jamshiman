'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACADEMIC_STATUSES, ACADEMIC_STATUS_LABELS, type AcademicStatus } from '@/lib/pulse/options'

type Dept = { id: string; name: string }

export function GradOnboardingForm({
  departments,
  currentHandle,
  defaultDeptId,
  defaultAcademicStatus,
}: {
  departments: Dept[]
  currentHandle: string | null
  defaultDeptId: string | null
  defaultAcademicStatus: AcademicStatus | null
}) {
  const router = useRouter()
  const [handle, setHandle] = useState(currentHandle ?? '')
  const [academicStatus, setAcademicStatus] = useState<AcademicStatus | ''>(defaultAcademicStatus ?? '')
  const [deptId, setDeptId] = useState(defaultDeptId ?? '')
  const [attest, setAttest] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = handle.length >= 3 && academicStatus && deptId && attest && !submitting

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: handle.toLowerCase(),
          academicStatus,
          deptId,
          gradAttestation: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Could not complete onboarding')
        setSubmitting(false)
        return
      }
      router.push('/profile')
      router.refresh()
    } catch (err) {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Anonymous handle</label>
        <input
          value={handle}
          onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="e.g. moon_grad"
          minLength={3}
          maxLength={20}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <p className="text-[11px] text-gray-400 mt-1">3–20 chars, lowercase letters/numbers/underscore. Shown only on non-anonymous posts.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Academic status</label>
        <div className="grid grid-cols-2 gap-2">
          {ACADEMIC_STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setAcademicStatus(s)}
              className={`px-3 py-2 rounded-xl text-sm border transition-all active:scale-[0.98] ${
                academicStatus === s
                  ? 'bg-brand-50 border-brand-300 text-brand-800 font-semibold'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {ACADEMIC_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Department</label>
        <select
          value={deptId}
          onChange={e => setDeptId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white"
        >
          <option value="">Select your department…</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <p className="text-[11px] text-gray-400 mt-1">Department missing? Ask an admin to add it ✨</p>
      </div>

      <label className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
        <input
          type="checkbox"
          checked={attest}
          onChange={e => setAttest(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm text-gray-700">
          I&apos;m a UMich graduate student, postdoc, or graduate researcher ✨
        </span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-[0_2px_6px_0_rgb(15,61,212,0.25)]"
      >
        {submitting ? 'Just a sec…' : 'Enter the grad cave 🫧'}
      </button>
    </form>
  )
}
