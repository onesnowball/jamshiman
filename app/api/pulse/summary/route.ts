import { NextRequest, NextResponse } from 'next/server'
import { requireViewer } from '@/lib/server-auth'
import { getUniversityBySlug } from '@/lib/school'
import { getDetroitTodayDateString } from '@/lib/pulse/date'
import { canShowAggregate } from '@/lib/pulse/privacy'
import { ACADEMIC_STATUS_LABELS } from '@/lib/pulse/options'

export const dynamic = 'force-dynamic'

type Agg = {
  group_type: 'school' | 'department' | 'academic_status' | 'department_status'
  dept_id: string | null
  academic_status: string | null
  unique_user_count: number
  checkin_count: number
  avg_sleep: number | null
  avg_stress: number | null
  avg_hours_worked: number | null
  total_caffeine: number
  worked_after_midnight_count: number
  mood_counts: Record<string, number>
}

export async function GET(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const schoolSlug = req.nextUrl.searchParams.get('school')
  if (!schoolSlug) return NextResponse.json({ error: 'Missing school' }, { status: 400 })
  const university = await getUniversityBySlug(schoolSlug)
  if (!university) return NextResponse.json({ error: 'School not found' }, { status: 404 })
  if (university.id !== viewer.university_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = getDetroitTodayDateString()
  const supa = supabase as any

  // Must have checked in today to unlock stats
  const { data: mine } = await supa
    .from('daily_checkins')
    .select('id')
    .eq('user_id', viewer.id)
    .eq('checkin_date', today)
    .maybeSingle()

  if (!mine) {
    return NextResponse.json({ locked: true, reason: 'checkin_required' })
  }

  const { data: aggData } = await supa
    .from('pulse_daily_aggregates')
    .select('group_type, dept_id, academic_status, unique_user_count, checkin_count, avg_sleep, avg_stress, avg_hours_worked, total_caffeine, worked_after_midnight_count, mood_counts')
    .eq('aggregate_date', today)
    .eq('university_id', university.id)

  const aggs = (aggData ?? []) as Agg[]

  const school = aggs.find(a => a.group_type === 'school') ?? null
  const dept = viewer.dept_id ? aggs.find(a => a.group_type === 'department' && a.dept_id === viewer.dept_id) ?? null : null
  const status = viewer.academic_status ? aggs.find(a => a.group_type === 'academic_status' && a.academic_status === viewer.academic_status) ?? null : null

  // School-wide stats also require k>=5.
  const schoolVisible = !!school && canShowAggregate(school.unique_user_count)

  // Most cooked department: top department aggregate by avg_stress, k>=5.
  const visibleDepts = aggs.filter(a => a.group_type === 'department' && canShowAggregate(a.unique_user_count) && a.avg_stress != null)
  let mostCookedDeptName: string | undefined
  if (visibleDepts.length) {
    visibleDepts.sort((a, b) => (b.avg_stress ?? 0) - (a.avg_stress ?? 0))
    const top = visibleDepts[0]
    if (top.dept_id) {
      const { data: deptRow } = await supa.from('departments').select('name').eq('id', top.dept_id).single()
      mostCookedDeptName = (deptRow as { name: string } | null)?.name
    }
  }

  let deptName: string | undefined
  if (viewer.dept_id) {
    const { data: deptRow } = await supa.from('departments').select('name').eq('id', viewer.dept_id).single()
    deptName = (deptRow as { name: string } | null)?.name
  }

  const deptVisible = !!dept && canShowAggregate(dept.unique_user_count)
  const statusVisible = !!status && canShowAggregate(status.unique_user_count)

  return NextResponse.json({
    locked: false,
    today: schoolVisible && school ? {
      checkinCount: school.checkin_count,
      avgSleep: school.avg_sleep,
      avgStress: school.avg_stress,
      avgHoursWorked: school.avg_hours_worked,
      totalCaffeine: school.total_caffeine,
      workedAfterMidnightCount: school.worked_after_midnight_count,
      moodCounts: school.mood_counts ?? {},
    } : null,
    schoolVisible,
    department: {
      visible: deptVisible,
      name: deptName,
      ...(deptVisible && dept ? {
        checkinCount: dept.checkin_count,
        avgSleep: dept.avg_sleep,
        avgStress: dept.avg_stress,
      } : {}),
    },
    academicStatus: {
      visible: statusVisible,
      label: viewer.academic_status ? ACADEMIC_STATUS_LABELS[viewer.academic_status as keyof typeof ACADEMIC_STATUS_LABELS] : undefined,
      ...(statusVisible && status ? {
        checkinCount: status.checkin_count,
        avgSleep: status.avg_sleep,
        avgStress: status.avg_stress,
      } : {}),
    },
    leaderboard: {
      mostCookedDepartment: mostCookedDeptName,
    },
  })
}
