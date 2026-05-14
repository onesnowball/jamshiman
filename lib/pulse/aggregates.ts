import { createAdminClient } from '@/lib/supabase/server'

type CheckinRow = {
  user_id: string
  university_id: string
  dept_id: string
  academic_status: string
  sleep_hours: number
  stress_level: number
  hours_worked: number | null
  caffeine_count: number | null
  worked_after_midnight: boolean
  mood: string
}

type GroupKey = {
  group_type: 'school' | 'department' | 'academic_status' | 'department_status'
  dept_id: string | null
  academic_status: string | null
}

function emptyBucket() {
  return {
    users: new Set<string>(),
    count: 0,
    sleepSum: 0,
    sleepN: 0,
    stressSum: 0,
    stressN: 0,
    hoursSum: 0,
    hoursN: 0,
    caffeineSum: 0,
    afterMidnight: 0,
    moodCounts: {} as Record<string, number>,
  }
}

function key(g: GroupKey): string {
  return `${g.group_type}|${g.dept_id ?? ''}|${g.academic_status ?? ''}`
}

/** Recomputes and upserts all aggregate rows for a university on a given Detroit date. */
export async function refreshPulseAggregatesForDate({
  universityId,
  date,
}: {
  universityId: string
  date: string
}): Promise<void> {
  const supabase = createAdminClient() as any

  const { data: rows } = await supabase
    .from('daily_checkins')
    .select('user_id, university_id, dept_id, academic_status, sleep_hours, stress_level, hours_worked, caffeine_count, worked_after_midnight, mood')
    .eq('university_id', universityId)
    .eq('checkin_date', date)

  const checkins = (rows ?? []) as CheckinRow[]

  const groups = new Map<string, ReturnType<typeof emptyBucket> & GroupKey>()

  function ensure(g: GroupKey) {
    const k = key(g)
    let bucket = groups.get(k)
    if (!bucket) {
      bucket = { ...emptyBucket(), ...g }
      groups.set(k, bucket)
    }
    return bucket
  }

  for (const c of checkins) {
    const targets: GroupKey[] = [
      { group_type: 'school', dept_id: null, academic_status: null },
      { group_type: 'department', dept_id: c.dept_id, academic_status: null },
      { group_type: 'academic_status', dept_id: null, academic_status: c.academic_status },
      { group_type: 'department_status', dept_id: c.dept_id, academic_status: c.academic_status },
    ]
    for (const g of targets) {
      const b = ensure(g)
      b.users.add(c.user_id)
      b.count += 1
      b.sleepSum += Number(c.sleep_hours); b.sleepN += 1
      b.stressSum += c.stress_level; b.stressN += 1
      if (c.hours_worked != null) { b.hoursSum += Number(c.hours_worked); b.hoursN += 1 }
      if (c.caffeine_count != null) { b.caffeineSum += c.caffeine_count }
      if (c.worked_after_midnight) b.afterMidnight += 1
      b.moodCounts[c.mood] = (b.moodCounts[c.mood] ?? 0) + 1
    }
  }

  // Delete existing rows for this (date, university) then re-insert.
  await supabase
    .from('pulse_daily_aggregates')
    .delete()
    .eq('aggregate_date', date)
    .eq('university_id', universityId)

  if (groups.size === 0) return

  const inserts = Array.from(groups.values()).map(b => ({
    aggregate_date: date,
    university_id: universityId,
    dept_id: b.dept_id,
    academic_status: b.academic_status,
    group_type: b.group_type,
    unique_user_count: b.users.size,
    checkin_count: b.count,
    avg_sleep: b.sleepN ? b.sleepSum / b.sleepN : null,
    avg_stress: b.stressN ? b.stressSum / b.stressN : null,
    avg_hours_worked: b.hoursN ? b.hoursSum / b.hoursN : null,
    total_caffeine: b.caffeineSum,
    worked_after_midnight_count: b.afterMidnight,
    mood_counts: b.moodCounts,
    updated_at: new Date().toISOString(),
  }))

  await supabase.from('pulse_daily_aggregates').insert(inserts)
}

/** TODO: wire to a scheduled job. Deletes raw daily_checkins older than 90 days. */
export async function cleanupOldCheckins(): Promise<number> {
  const supabase = createAdminClient() as any
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - 90)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const { data } = await supabase
    .from('daily_checkins')
    .delete()
    .lt('checkin_date', cutoffStr)
    .select('id')
  return (data ?? []).length
}
