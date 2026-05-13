import { NextResponse, type NextRequest } from 'next/server'
import { canonicalSchoolPathSlug, canonicalSchoolSlug, isSchoolPathSlug } from '@/lib/school-slugs'

// Routes anyone can visit without being signed in
const PUBLIC_PATHS = ['/', '/auth']
const DEV_BYPASS_COOKIE = 'jamshiman-dev-bypass'

function isSchoolSlug(segment: string): boolean {
  return isSchoolPathSlug(segment)
}

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function hasSessionCookie(request: NextRequest): boolean {
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace('https://', '')
    .split('.')[0]
  const key = `sb-${projectRef}-auth-token`

  // Check unchunked cookie
  if (request.cookies.has(key)) return true

  // Check chunked cookie (.0 chunk is enough to confirm a session exists)
  if (request.cookies.has(`${key}.0`)) return true

  return false
}

function hasDevBypassCookie(request: NextRequest): boolean {
  return (
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true' &&
    request.cookies.get(DEV_BYPASS_COOKIE)?.value === '1'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isPublic(pathname) && !hasSessionCookie(request) && !hasDevBypassCookie(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // Track the last school the user visited so that school-agnostic pages
  // (profile, messages, admin) can keep the Navbar in the right school context.
  const firstSegment = pathname.split('/')[1] ?? ''
  if (isSchoolSlug(firstSegment)) {
    const canonicalSchool = canonicalSchoolSlug(firstSegment)

    if (canonicalSchool !== firstSegment) {
      const redirectUrl = request.nextUrl.clone()
      const suffix = pathname.slice(firstSegment.length + 1)
      redirectUrl.pathname = `/${canonicalSchool}${suffix}`
      const response = NextResponse.redirect(redirectUrl)
      response.cookies.set('last_school', canonicalSchool, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      })
      return response
    }
  }

  const response = NextResponse.next()
  const lastSchool = request.cookies.get('last_school')?.value
  if (lastSchool && !canonicalSchoolPathSlug(lastSchool)) {
    response.cookies.delete('last_school')
  }

  if (isSchoolSlug(firstSegment)) {
    response.cookies.set('last_school', canonicalSchoolSlug(firstSegment), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
