import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { getEmailDomain, normalizeEmail } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = authHeader.replace('Bearer ', '')
  const adminSupabase = createAdminClient()

  // Verify the token and get the user
  const { data: { user }, error } = await adminSupabase.auth.getUser(accessToken)
  if (error || !user?.email) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const normalizedEmail = normalizeEmail(user.email)
  const domain = getEmailDomain(normalizedEmail)

  // Only allow emails from universities that exist and are active in our DB.
  // This is the single source of truth — no separate env var list needed.
  const { data: rawUniversity } = await adminSupabase
    .from('universities')
    .select('id')
    .eq('domain', domain)
    .eq('active', true)
    .single()
  const university = rawUniversity as { id: string } | null

  if (!university) {
    return NextResponse.json({ error: 'invalid_domain' }, { status: 403 })
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
    return NextResponse.json({ error: 'profile_failed', detail: profileError.message }, { status: 500 })
  }

  // Check if the user still needs to choose a handle (new users or existing users who skipped)
  const { data: profile } = await adminSupabase
    .from('users')
    .select('handle')
    .eq('id', user.id)
    .single()

  const needsHandle = !(profile as { handle: string | null } | null)?.handle

  return NextResponse.json({ ok: true, needsHandle })
}
