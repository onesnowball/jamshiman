import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireViewer } from '@/lib/server-auth'
import { getDetroitTodayDateString } from '@/lib/pulse/date'
import { MOODS, CONTEXT_TAGS } from '@/lib/pulse/options'
import { refreshPulseAggregatesForDate } from '@/lib/pulse/aggregates'
import { awardXp } from '@/lib/xp/awardXp'

const Body = z.object({
  sleepHours: z.number().min(0).max(14),
  stressLevel: z.number().int().min(1).max(10),
  mood: z.enum(MOODS),
  hoursWorked: z.number().min(0).max(24).nullable().optional(),
  caffeineCount: z.number().int().min(0).max(20),
  workedAfterMidnight: z.boolean().optional(),
  contextTag: z.enum(CONTEXT_TAGS).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth
  // requireViewer guarantees onboarded; double-check dept_id/academic_status for Pulse-specific fields.
  if (!viewer.dept_id || !viewer.academic_status) {
    return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = Body.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const today = getDetroitTodayDateString()
  const supa = supabase as any

  const payload = {
    user_id: viewer.id,
    university_id: viewer.university_id,
    dept_id: viewer.dept_id,
    academic_status: viewer.academic_status,
    checkin_date: today,
    sleep_hours: parsed.data.sleepHours,
    stress_level: parsed.data.stressLevel,
    mood: parsed.data.mood,
    hours_worked: parsed.data.hoursWorked ?? null,
    caffeine_count: parsed.data.caffeineCount,
    worked_after_midnight: parsed.data.workedAfterMidnight ?? false,
    context_tag: parsed.data.contextTag ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supa
    .from('daily_checkins')
    .upsert(payload, { onConflict: 'user_id,checkin_date' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await refreshPulseAggregatesForDate({ universityId: viewer.university_id, date: today })

  // XP idempotent per (user, date)
  await awardXp({
    userId: viewer.id,
    universityId: viewer.university_id,
    eventType: 'daily_checkin',
    idempotencyKey: `daily_checkin:${viewer.id}:${today}`,
  })

  return NextResponse.json({ ok: true, date: today })
}
