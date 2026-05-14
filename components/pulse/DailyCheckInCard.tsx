'use client'

import { useState } from 'react'
import { MoodChips } from './MoodChips'
import { StressSlider } from './StressSlider'
import { CONTEXT_TAGS, CONTEXT_TAG_LABELS, type ContextTag, type Mood } from '@/lib/pulse/options'

export type ExistingCheckin = {
  sleep_hours: number
  stress_level: number
  mood: Mood
  hours_worked: number | null
  caffeine_count: number | null
  worked_after_midnight: boolean
  context_tag: ContextTag | null
}

export function DailyCheckInCard({
  existing,
  onSaved,
  onDeleted,
}: {
  existing: ExistingCheckin | null
  onSaved: () => void
  onDeleted: () => void
}) {
  const [sleep, setSleep] = useState<string>(existing ? String(existing.sleep_hours) : '7')
  const [stress, setStress] = useState<number>(existing?.stress_level ?? 5)
  const [mood, setMood] = useState<Mood | null>(existing?.mood ?? null)
  const [hoursWorked, setHoursWorked] = useState<string>(existing?.hours_worked != null ? String(existing.hours_worked) : '')
  const [caffeine, setCaffeine] = useState<string>(existing?.caffeine_count != null ? String(existing.caffeine_count) : '')
  const [afterMidnight, setAfterMidnight] = useState(existing?.worked_after_midnight ?? false)
  const [ctx, setCtx] = useState<ContextTag | null>(existing?.context_tag ?? null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!mood) { setErr('Pick a mood'); return }
    const sleepNum = Number(sleep)
    if (!(sleepNum >= 0 && sleepNum <= 14)) { setErr('Sleep must be between 0 and 14 hours'); return }
    setBusy(true); setErr(null)
    const res = await fetch('/api/pulse/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sleepHours: sleepNum,
        stressLevel: stress,
        mood,
        hoursWorked: hoursWorked === '' ? null : Number(hoursWorked),
        caffeineCount: caffeine === '' ? null : Number(caffeine),
        workedAfterMidnight: afterMidnight,
        contextTag: ctx,
      }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setErr(typeof d?.error === 'string' ? d.error : 'Could not save')
      return
    }
    onSaved()
  }

  async function del() {
    if (!existing) return
    if (!confirm('Delete today\'s check-in? Your stats will lock again.')) return
    setBusy(true)
    const res = await fetch('/api/pulse/checkin/today', { method: 'DELETE' })
    setBusy(false)
    if (res.ok) onDeleted()
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Sleep last night (hours)</label>
          <input
            type="number" step="0.5" min={0} max={14}
            value={sleep}
            onChange={e => setSleep(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Stress today</label>
          <StressSlider value={stress} onChange={setStress} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Mood</label>
        <MoodChips value={mood} onChange={setMood} />
      </div>

      <details className="rounded-xl bg-gray-50 border border-gray-100">
        <summary className="px-3 py-2 text-xs text-gray-600 cursor-pointer">Optional context (skip if you want)</summary>
        <div className="p-3 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Hours worked</label>
              <input type="number" step="0.5" min={0} max={24} value={hoursWorked} onChange={e => setHoursWorked(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Coffees/teas</label>
              <input type="number" step="1" min={0} max={20} value={caffeine} onChange={e => setCaffeine(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input type="checkbox" checked={afterMidnight} onChange={e => setAfterMidnight(e.target.checked)} />
            Worked past midnight 🌙
          </label>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">What kind of week?</label>
            <div className="flex flex-wrap gap-1.5">
              {CONTEXT_TAGS.map(t => (
                <button key={t} type="button" onClick={() => setCtx(ctx === t ? null : t)}
                  className={`px-2 py-1 rounded-full text-[11px] border transition-all ${ctx === t ? 'bg-brand-50 border-brand-300 text-brand-800' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {CONTEXT_TAG_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]">
          {busy ? '…' : existing ? 'Update today\'s check-in 🌙' : 'Unlock today\'s pulse 🌙'}
        </button>
        {existing && (
          <button type="button" onClick={del} disabled={busy} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
