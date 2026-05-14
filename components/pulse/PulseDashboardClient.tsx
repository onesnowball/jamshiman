'use client'

import { useCallback, useEffect, useState } from 'react'
import { DailyCheckInCard, type ExistingCheckin } from './DailyCheckInCard'
import { PulseStatsCard } from './PulseStatsCard'
import { PulseMoodDistribution } from './PulseMoodDistribution'
import { PulseLockedState } from './PulseLockedState'
import { ContributionCelebration } from '@/components/brand/ContributionCelebration'
import { EmptyStateIllustration } from '@/components/brand/EmptyStateIllustration'
import { CuteLoader } from '@/components/brand/CuteLoader'

type Summary =
  | { locked: true; reason: 'checkin_required' }
  | {
      locked: false
      today: null | {
        checkinCount: number
        avgSleep: number | null
        avgStress: number | null
        avgHoursWorked: number | null
        totalCaffeine: number
        workedAfterMidnightCount: number
        moodCounts: Record<string, number>
      }
      schoolVisible: boolean
      department: { visible: boolean; name?: string; checkinCount?: number; avgSleep?: number | null; avgStress?: number | null }
      academicStatus: { visible: boolean; label?: string; checkinCount?: number; avgSleep?: number | null; avgStress?: number | null }
      leaderboard: { mostCookedDepartment?: string }
    }

export function PulseDashboardClient({ schoolSlug }: { schoolSlug: string }) {
  const [existing, setExisting] = useState<ExistingCheckin | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [celebrate, setCelebrate] = useState(false)

  const loadToday = useCallback(async () => {
    const r = await fetch('/api/pulse/me/today', { cache: 'no-store' })
    if (r.ok) {
      const d = await r.json()
      setExisting(d.checkin ?? null)
    }
  }, [])

  const loadSummary = useCallback(async () => {
    const r = await fetch(`/api/pulse/summary?school=${encodeURIComponent(schoolSlug)}`, { cache: 'no-store' })
    if (r.ok) {
      const d = await r.json()
      setSummary(d)
    }
  }, [schoolSlug])

  useEffect(() => {
    (async () => {
      await Promise.all([loadToday(), loadSummary()])
      setLoading(false)
    })()
  }, [loadToday, loadSummary])

  // Poll summary every 30s after unlocked.
  useEffect(() => {
    if (!summary || summary.locked) return
    const id = setInterval(loadSummary, 30_000)
    return () => clearInterval(id)
  }, [summary, loadSummary])

  if (loading) return <CuteLoader label="Reading the pulse…" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">{existing ? "Today's check-in (editable until midnight ET)" : 'Daily check-in'}</p>
            <DailyCheckInCard
              existing={existing}
              onSaved={async () => {
                setCelebrate(false)
                await Promise.all([loadToday(), loadSummary()])
                setCelebrate(true)
              }}
              onDeleted={async () => {
                setExisting(null)
                await Promise.all([loadToday(), loadSummary()])
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {summary?.locked || !summary ? (
            <PulseLockedState />
          ) : (
            <Unlocked summary={summary} />
          )}
        </div>
      </div>
      <ContributionCelebration show={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  )
}

function Unlocked({ summary }: { summary: Extract<Summary, { locked: false }> }) {
  const t = summary.today
  return (
    <div className="space-y-4 motion-safe:animate-[pulse-fade_400ms_ease-out]">
      <style>{`@keyframes pulse-fade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }`}</style>

      {!summary.schoolVisible || !t ? (
        <div className="card p-6">
          <EmptyStateIllustration
            variant="pulse_not_enough_data"
            title="A few grad students checked in, but we need more to keep this anonymous."
            body="School-wide stats appear once at least 5 unique students have checked in today."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PulseStatsCard title="UMich grad sleep today" emoji="🌙" value={t.avgSleep} decimals={1} suffix="h" subtitle="average" />
            <PulseStatsCard title="Stress weather" emoji="🔥" value={t.avgStress} decimals={1} suffix=" / 10" subtitle="average" />
            <PulseStatsCard title="Check-ins today" emoji="🫧" value={t.checkinCount} />
            <PulseStatsCard title="Worked past midnight" emoji="🌚" value={t.workedAfterMidnightCount} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-3">Your department 🫧</p>
              {summary.department.visible ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">{summary.department.name}</p>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>sleep <b className="text-gray-900">{summary.department.avgSleep?.toFixed(1) ?? '—'}h</b></span>
                    <span>stress <b className="text-gray-900">{summary.department.avgStress?.toFixed(1) ?? '—'}/10</b></span>
                    <span>{summary.department.checkinCount} check-ins</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Not enough check-ins yet to show anonymously.</p>
              )}
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-3">Your cohort{summary.academicStatus.label ? ` · ${summary.academicStatus.label}` : ''}</p>
              {summary.academicStatus.visible ? (
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>sleep <b className="text-gray-900">{summary.academicStatus.avgSleep?.toFixed(1) ?? '—'}h</b></span>
                  <span>stress <b className="text-gray-900">{summary.academicStatus.avgStress?.toFixed(1) ?? '—'}/10</b></span>
                  <span>{summary.academicStatus.checkinCount} check-ins</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Not enough check-ins yet to show anonymously.</p>
              )}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs text-gray-500 mb-3">Mood distribution 🌱</p>
            <PulseMoodDistribution counts={t.moodCounts} />
          </div>

          {summary.leaderboard.mostCookedDepartment && (
            <div className="card p-4 flex items-center gap-3">
              <div className="text-2xl">🔥</div>
              <div>
                <p className="text-xs text-gray-500">Most cooked department today</p>
                <p className="text-sm font-semibold text-gray-900">{summary.leaderboard.mostCookedDepartment}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
