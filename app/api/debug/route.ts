import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return NextResponse.json({
    userId: user?.id ?? null,
    email: user?.email ?? null,
    cookies: allCookies,
  })
}
