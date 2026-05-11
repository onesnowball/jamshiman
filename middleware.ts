import { NextResponse, type NextRequest } from 'next/server'

// Routes anyone can visit without being signed in
const PUBLIC_PATHS = ['/', '/auth']

// Top-level path segments that are NOT school slugs
const RESERVED_SEGMENTS = new Set(['admin', 'profile', 'messages', 'auth', 'api', '_next'])

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isPublic(pathname) && !hasSessionCookie(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // Track the last school the user visited so that school-agnostic pages
  // (profile, messages, admin) can keep the Navbar in the right school context.
  const response = NextResponse.next()
  const firstSegment = pathname.split('/')[1] ?? ''
  if (firstSegment && !RESERVED_SEGMENTS.has(firstSegment)) {
    response.cookies.set('last_school', firstSegment, {
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
