/**
 * GET /api/admin/debug-school?school=uiuc
 *
 * Admin-only diagnostic: shows departments and advisors (including inactive)
 * for the resolved university, plus lightweight migration column checks.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { slugToDomain } from '@/lib/school-slugs'

export async function GET(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const school = req.nextUrl.searchParams.get('school') ?? 'uiuc'
  const domain = slugToDomain(school)
  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  // 1. Resolve university
  const { data: uniRaw, error: uniErr } = await supabaseAny
    .from('universities')
    .select('id, name, domain, active')
    .eq('domain', domain)
    .single()

  const uni = uniRaw as { id: string; name: string; domain: string; active: boolean } | null

  if (!uni) {
    return NextResponse.json({ error: `No university found for domain ${domain}`, uniErr })
  }

  // 2. Departments
  const { data: depts, error: deptErr } = await supabaseAny
    .from('departments')
    .select('id, name, slug, active, is_board_category')
    .eq('university_id', uni.id)
    .order('is_board_category', { ascending: true })
    .order('name')

  // 3. Advisors (ALL — including inactive)
  const { data: advisors, error: advErr } = await supabaseAny
    .from('advisors')
    .select('id, name, active, dept_id, university_id, created_at')
    .eq('university_id', uni.id)
    .order('created_at', { ascending: false })

  // 4. Courses
  const { data: courses, error: courseErr } = await supabaseAny
    .from('courses')
    .select('id, code, name, dept_id, university_id, created_at')
    .eq('university_id', uni.id)
    .order('created_at', { ascending: false })

  // 5. Check if is_pinned column exists (migration 015)
  const { data: pinnedCheck, error: pinnedErr } = await supabaseAny
    .from('posts')
    .select('is_pinned')
    .limit(1)

  // 6. Check if handle column exists (migration 014)
  const { data: handleCheck, error: handleErr } = await supabaseAny
    .from('users')
    .select('id, handle')
    .limit(1)

  return NextResponse.json({
    university: uni,
    departments: { data: depts, error: deptErr, count: depts?.length ?? 0 },
    advisors: {
      data: advisors,
      error: advErr,
      count: advisors?.length ?? 0,
      activeCount: (advisors ?? []).filter((a: any) => a.active).length,
    },
    courses: { data: courses, error: courseErr, count: courses?.length ?? 0 },
    migrations: {
      '015_is_pinned': pinnedErr ? `MISSING: ${pinnedErr.message}` : 'OK',
      '014_handle': handleErr ? `MISSING: ${handleErr.message}` : 'OK',
    },
  })
}
