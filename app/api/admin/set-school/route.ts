import { NextRequest, NextResponse } from 'next/server'
import { getAdminViewer } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { domainToSlug, slugToDomain } from '@/lib/school-slugs'

/**
 * GET /api/admin/set-school?school=northwestern
 *
 * Legacy helper: sets the `last_school` cookie, then redirects to the
 * school-scoped admin page.
 */
export async function GET(req: NextRequest) {
  const viewer = await getAdminViewer()
  if (!viewer) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const school = req.nextUrl.searchParams.get('school') ?? ''
  if (!school) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  const supabase = createAdminClient()
  const { data: university } = await supabase
    .from('universities')
    .select('domain')
    .eq('domain', slugToDomain(school))
    .eq('active', true)
    .single()

  if (!university) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  const schoolSlug = domainToSlug((university as { domain: string }).domain)
  const response = NextResponse.redirect(new URL(`/${schoolSlug}/admin`, req.url))
  response.cookies.set('last_school', schoolSlug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: false,
  })
  return response
}
