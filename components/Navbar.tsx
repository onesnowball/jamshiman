import { cookies } from 'next/headers'
import { getOptionalViewer } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { NavbarClient } from './NavbarClient'

export async function Navbar({ school }: { school?: string } = {}) {
  const viewer = await getOptionalViewer()
  const isGlobalAdmin = viewer?.role === 'admin'
  // L-2: Campus admins (non-global role, but with campus_admins rows) also get admin UI.
  const isCampusAdmin = !isGlobalAdmin && (viewer?.campusAdminUniversityIds?.length ?? 0) > 0
  const isAnyAdmin = isGlobalAdmin || isCampusAdmin
  const supabase = createAdminClient()

  let resolvedSchool = school

  // For any admin on non-school pages (profile, messages, admin),
  // restore whichever school they last browsed via the last_school cookie.
  if (!resolvedSchool && isAnyAdmin) {
    const lastSchool = cookies().get('last_school')?.value
    if (lastSchool) resolvedSchool = lastSchool
  }

  // For regular users (and campus admins without a last_school cookie),
  // fall back to their home university.
  if (!resolvedSchool && viewer?.university_id) {
    const { data } = await supabase
      .from('universities')
      .select('domain')
      .eq('id', viewer.university_id)
      .single()
    if (data) resolvedSchool = (data as { domain: string }).domain.split('.')[0]
  }

  // For global admins, fetch all active universities so they can switch campuses.
  // Campus admins only manage one school so no switcher needed.
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
      isAdmin={isAnyAdmin}
      school={resolvedSchool}
      schools={schools}
    />
  )
}
