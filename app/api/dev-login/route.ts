import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  DEV_BYPASS_COOKIE,
  getDevBypassEmail,
  getDevBypassPassword,
  getDevBypassEmailHash,
  isDevBypassEnabled,
} from '@/lib/dev-bypass'

export async function POST() {
  if (!isDevBypassEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const email = getDevBypassEmail()
  const password = getDevBypassPassword()

  if (!password) {
    return NextResponse.json(
      { error: 'DEV_BYPASS_PASSWORD is missing from the environment.' },
      { status: 500 }
    )
  }

  const adminSupabase = createAdminClient()

  const { data: usersPage, error: listError } = await adminSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const existingAuthUser = usersPage.users.find(user => user.email?.toLowerCase() === email)

  let authUserId = existingAuthUser?.id

  if (existingAuthUser) {
    const { error } = await adminSupabase.auth.admin.updateUserById(existingAuthUser.id, {
      password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Could not create dev user.' }, { status: 500 })
    }

    authUserId = data.user.id
  }

  if (!authUserId) {
    return NextResponse.json({ error: 'Missing dev user id.' }, { status: 500 })
  }

  const domain = email.split('@')[1]
  const { data: rawUniversity, error: universityError } = await adminSupabase
    .from('universities')
    .select('id')
    .eq('domain', domain)
    .single()
  const university = rawUniversity as { id: string } | null

  if (universityError || !university) {
    return NextResponse.json(
      { error: 'No university exists for the dev bypass email domain.' },
      { status: 500 }
    )
  }

  const { error: upsertError } = await adminSupabase
    .from('users')
    .upsert({
      id: authUserId,
      email_hash: getDevBypassEmailHash(),
      university_id: university.id,
      role: 'admin',
    } as any, { onConflict: 'id' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(DEV_BYPASS_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  })

  return response
}
