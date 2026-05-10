import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return NextResponse.json({
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    cookies: allCookies,
  })
}
