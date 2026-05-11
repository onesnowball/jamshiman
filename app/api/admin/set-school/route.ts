import { NextRequest, NextResponse } from 'next/server'
import { getAdminViewer } from '@/lib/server-auth'

/**
 * GET /api/admin/set-school?school=northwestern
 *
 * Sets the `last_school` cookie (same as middleware does when visiting a
 * school page) then redirects to /admin. Used by the campus switcher so that
 * admins don't need a full board-page round-trip to switch context.
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

  const response = NextResponse.redirect(new URL('/admin', req.url))
  response.cookies.set('last_school', school, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    httpOnly: false,
  })
  return response
}
