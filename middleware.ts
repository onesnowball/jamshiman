import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

function hasDevBypassCookie(request: NextRequest): boolean {
  return (
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true' &&
    request.cookies.get(DEV_BYPASS_COOKIE)?.value === '1'
  )
}

/**
 * Touches the Supabase session: validates the access token and, if expired,
 * refreshes it using the refresh-token cookie and writes a new access-token
 * cookie onto the response. Without this, sessions silently lapse after the
 * ~1 h access-token lifetime even though the refresh token is still valid.
 */
async function refreshSession(request: NextRequest, response: NextResponse): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return false

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: cookiesToSet => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  return !!data.user
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Track the last school the user visited so that school-agnostic pages
  // (profile, messages, admin) can keep the Navbar in the right school context.
  const firstSegment = pathname.split('/')[1] ?? ''
  if (isSchoolSlug(firstSegment)) {
    const canonicalSchool = canonicalSchoolSlug(firstSegment)
    if (canonicalSchool !== firstSegment) {
      const redirectUrl = request.nextUrl.clone()
      const suffix = pathname.slice(firstSegment.length + 1)
      redirectUrl.pathname = `/${canonicalSchool}${suffix}`
      const redirectResp = NextResponse.redirect(redirectUrl)
      redirectResp.cookies.set('last_school', canonicalSchool, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      })
      return redirectResp
    }
  }

  const response = NextResponse.next()

  // Refresh Supabase session (writes refreshed cookies onto response).
  // Skip on public paths to avoid extra latency for unauthenticated browsing.
  let hasSession = false
  if (!isPublic(pathname)) {
    hasSession = await refreshSession(request, response)
  } else {
    // Best-effort refresh on public paths too, but ignore the result.
    try { await refreshSession(request, response) } catch {}
  }

  if (!isPublic(pathname) && !hasSession && !hasDevBypassCookie(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

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
