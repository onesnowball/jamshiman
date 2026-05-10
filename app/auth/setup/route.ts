import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getAllowedSchoolDomains, getEmailDomain, isAllowedSchoolEmail, normalizeEmail } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const supabase = createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const normalizedEmail = normalizeEmail(user.email)
  if (!isAllowedSchoolEmail(normalizedEmail)) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_domain`)
  }

  const domain = getEmailDomain(normalizedEmail)
  const allowedDomains = getAllowedSchoolDomains()
  if (!allowedDomains.includes(domain)) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_domain`)
  }

  const { data: rawUniversity } = await adminSupabase
    .from('universities')
    .select('id')
    .eq('domain', domain)
    .single()
  const university = rawUniversity as { id: string } | null

  if (!university) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_domain`)
  }

  const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  const { error: profileError } = await adminSupabase.from('users').upsert({
    id: user.id,
    email_hash: emailHash,
    university_id: university.id,
    ...(adminEmails.includes(normalizedEmail) ? { role: 'admin' as const } : {}),
  } as any, { onConflict: 'id' })

  if (profileError) {
    return NextResponse.redirect(`${origin}/auth/login?error=profile_failed`)
  }

  return NextResponse.redirect(`${origin}/advisors`)
}
