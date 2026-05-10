import { getOptionalViewer } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { NavbarClient } from './NavbarClient'

export async function Navbar({ school }: { school?: string } = {}) {
  const viewer = await getOptionalViewer()

  let resolvedSchool = school
  if (!resolvedSchool && viewer?.university_id) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('universities')
      .select('domain')
      .eq('id', viewer.university_id)
      .single()
    if (data) resolvedSchool = (data as { domain: string }).domain.split('.')[0]
  }

  return <NavbarClient isAdmin={viewer?.role === 'admin'} school={resolvedSchool} />
}
