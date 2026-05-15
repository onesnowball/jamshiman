import Link from 'next/link'
import { Moon, ArrowUpRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'

/**
 * Daily check-in card on the school dashboard. Same data wiring as
 * before — one row select keyed to the viewer + today. Adds
 * stress_level to the existing select so the completed state can
 * surface today's number in mono.
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
      className="group flex items-center justify-between gap-4 rounded-xl bg-white px-5 py-4 ring-1 ring-stone-200 shadow-sm hover:ring-slate-300 hover:shadow transition-all duration-200"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200 text-slate-700">
          <Moon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          {checkedIn ? (
            <>
              <p className="text-sm font-medium text-stone-900">
                Today&apos;s check-in is in
                {stress != null && (
                  <span className="ml-2 font-mono text-xs text-slate-700 tabular-nums">
                    {stress}/10 stress
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                See how the rest of campus is holding up.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-stone-900">
                How cooked are you today?
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                One quiet check-in. Unlocks the anonymous pulse.
              </p>
            </>
          )}
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-slate-700 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
    </Link>
  )
}
