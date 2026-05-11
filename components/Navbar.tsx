import { cookies } from 'next/headers'
import { getOptionalViewer } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { NavbarClient } from './NavbarClient'

export async function Navbar({ school }: { school?: string } = {}) {
  const viewer = await getOptionalViewer()
  const isGlobalAdmin = viewer?.role === 'admin'
  const supabase = createAdminClient()

  let resolvedSchool = school

  // For global admins on non-school pages (profile, messages, admin),
  // restore whichever school they last browsed via the last_school cookie.
  if (!resolvedSchool && isGlobalAdmin) {
    const lastSchool = cookies().get('last_school')?.value
    if (lastSchool) resolvedSchool = lastSchool
  }

  // For regular users, fall back to their home university.
  if (!resolvedSchool && viewer?.university_id) {
    const { data } = await supabase
      .from('universities')
      .select('domain')
      .eq('id', viewer.university_id)
      .single()
    if (data) resolvedSchool = (data as { domain: string }).domain.split('.')[0]
  }

  // For global admins, fetch all active universities so they can switch campuses
  let schools: { name: string; slug: string }[] = []
  if (isGlobalAdmin) {
    const { data } = await supabase
      .from('universities')
      .select('name, domain')
      .eq('active', true)
      .order('name')
    schools = ((data ?? []) as { name: string; domain: string }[]).map(u => ({
      name: u.name,
      slug: u.domain.split('.')[0],
    }))
  }

  return (
    <NavbarClient
      isAdmin={isGlobalAdmin}
      school={resolvedSchool}
      schools={schools}
    />
  )
}
