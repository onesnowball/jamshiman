import { NextResponse } from 'next/server'
import { getActionClient } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'
import { isOnboarded } from '@/lib/onboarding'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isOnboarded(viewer as any)) return NextResponse.json({ error: 'Onboarding required' }, { status: 403 })

  const today = getDetroitTodayDateString()
  const { data } = await (supabase as any)
    .from('daily_checkins')
    .select('*')
    .eq('user_id', viewer.id)
    .eq('checkin_date', today)
    .maybeSingle()

  return NextResponse.json({ today, checkin: data ?? null })
}
