import { NextResponse } from 'next/server'
import { requireViewer } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const today = getDetroitTodayDateString()
  const { data } = await (supabase as any)
    .from('daily_checkins')
    .select('*')
    .eq('user_id', viewer.id)
    .eq('checkin_date', today)
    .maybeSingle()

  return NextResponse.json({ today, checkin: data ?? null })
}
