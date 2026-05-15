import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'
import { RollingNumber } from '@/components/ui/RollingNumber'

/**
 * The unforgettable moment of the school dashboard.
 *
 * Uncompleted: a slow amber pulse dot sitting under serif copy — quiet,
 * alive, asking for one minute of your time.
 * Completed:   one rolling number recap of today's stress level on a
 *              10-scale, in the accent color, with a subtle "in" tag.
 *
 * Server component — preserves the prior single-query data wiring and
 * adds `stress_level` to the same row select so the recap is a real
 * value, not a fabricated one.
 */
export async function SchoolHomePulseCard({ school }: { school: string }) {
  const viewer = await getOptionalViewer()
  if (!viewer) return null

  const today = getDetroitTodayDateString()
  const { data } = await (createAdminClient() as any)
    .from('daily_checkins')
    .select('id, mood, stress_level')
    .eq('user_id', viewer.id)
    .eq('checkin_date', today)
    .maybeSingle()

  const checkedIn = !!data
  const stress: number | null = checkedIn ? (data?.stress_level ?? null) : null

  return (
    <Link
      href={`/${school}/pulse`}
      prefetch={false}
      aria-label={checkedIn ? "Open today's pulse" : "Open today's check-in"}
      className="group block rounded-2xl border border-stone-800 bg-stone-900 px-5 py-5 transition-colors duration-200 hover:border-amber-300/40 hover:bg-stone-800/70"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">

          {checkedIn ? (
            // Completed state: rolling number recap with the accent color
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-display text-4xl font-semibold text-amber-300 leading-none">
                <RollingNumber value={stress ?? 0} />
              </span>
              <span className="text-xs text-stone-400 tracking-wide">/10</span>
            </div>
          ) : (
            // Uncompleted state: slow pulse dot
            <span
              aria-hidden
              className="pulse-dot relative inline-flex h-3 w-3 shrink-0 rounded-full bg-amber-300"
            />
          )}

          <div className="min-w-0">
            {checkedIn ? (
              <>
                <p className="font-display text-base text-stone-100 leading-tight">
                  Today&rsquo;s stress is in.
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  See how the rest of campus is holding up.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-base text-stone-100 leading-tight">
                  How cooked are you today?
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  One quiet check-in. Unlocks the anonymous pulse.
                </p>
              </>
            )}
          </div>
        </div>

        <ArrowUpRight
          className="w-4 h-4 text-stone-600 group-hover:text-amber-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
        />
      </div>
    </Link>
  )
}
