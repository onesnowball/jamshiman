import { NextResponse, type NextRequest } from 'next/server'

// Routes anyone can visit without being signed in
const PUBLIC_PATHS = ['/', '/auth']

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
