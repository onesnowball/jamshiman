import { NextResponse } from 'next/server'
import { getActionClient } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'
import { refreshPulseAggregatesForDate } from '@/lib/pulse/aggregates'

export async function DELETE() {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = getDetroitTodayDateString()
  const { error } = await (supabase as any)
    .from('daily_checkins')
    .delete()
    .eq('user_id', viewer.id)
    .eq('checkin_date', today)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await refreshPulseAggregatesForDate({ universityId: viewer.university_id, date: today })

  return NextResponse.json({ ok: true })
}
