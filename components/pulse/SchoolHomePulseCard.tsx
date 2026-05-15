import Link from 'next/link'
import { Moon, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'

/**
 * Small card on the school home that nudges the viewer toward today's
 * pulse check-in. If they haven't checked in yet, it's a CTA. If they
 * have, it confirms they did and links to the dashboard.
 *
 * Server component — runs one tiny query per home-page render.
 */
export async function SchoolHomePulseCard({ school }: { school: string }) {
  const viewer = await getOptionalViewer()
  if (!viewer) return null

  const today = getDetroitTodayDateString()
  const { data } = await (createAdminClient() as any)
    .from('daily_checkins')
    .select('id, mood')
    .eq('user_id', viewer.id)
    .eq('checkin_date', today)
    .maybeSingle()

  const checkedIn = !!data

  return (
    <Link
      href={`/${school}/pulse`}
      prefetch={false}
      className="card p-4 flex items-center justify-between gap-3 hover:border-brand-200 hover:shadow-md transition-all group bg-gradient-to-br from-white to-brand-50/40"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
          <Moon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          {checkedIn ? (
            <>
              <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700">
                Today&apos;s check-in is in 🌙
              </p>
              <p className="text-xs text-gray-500">Tap to see how the rest of campus is doing.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700">
                How cooked are you today? 🔥
              </p>
              <p className="text-xs text-gray-500">Check in to unlock today&apos;s anonymous pulse.</p>
            </>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 shrink-0" />
    </Link>
  )
}
