import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getAllowedSchoolDomains, getEmailDomain, isAllowedSchoolEmail, normalizeEmail } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/advisors'

  const supabase = createClient()
  const adminSupabase = createAdminClient()

  let user = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }
    user = data.user
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }
    user = data.user
  } else {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_token`)
  }

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const normalizedEmail = normalizeEmail(user.email)
  if (!isAllowedSchoolEmail(normalizedEmail)) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_domain`)
  }

  // Upsert user profile on first login
  const emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

  // Find university by domain
  const allowedDomains = getAllowedSchoolDomains()
  const domain = getEmailDomain(normalizedEmail)
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

  const { error: profileError } = await adminSupabase.from('users').upsert({
    id: user.id,
    email_hash: emailHash,
    university_id: university.id,
    ...(adminEmails.includes(normalizedEmail) ? { role: 'admin' as const } : {}),
  } as any, { onConflict: 'id' })

  if (profileError) {
    return NextResponse.redirect(`${origin}/auth/login?error=profile_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
