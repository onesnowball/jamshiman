import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const authCookie = cookieStore.get('sb-oerrxzqiwecmsjuxtlki-auth-token')
  let cookieParsed = null
  try {
    cookieParsed = authCookie?.value ? JSON.parse(authCookie.value) : 'empty'
  } catch {
    cookieParsed = `parse error — raw starts with: ${authCookie?.value?.substring(0, 80)}`
  }

  return NextResponse.json({
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    cookies: allCookies,
    authCookieLength: authCookie?.value?.length ?? 0,
    authCookieParsed: cookieParsed,
  })
}
