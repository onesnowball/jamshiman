import { redirect } from 'next/navigation'
import { getAdminFallbackSlug } from '@/lib/admin-context'
import { getAdminViewer } from '@/lib/server-auth'

import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LegacyAdminRedirectPage() {
  noStore()
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const school = await getAdminFallbackSlug(viewer)
  if (!school) redirect('/auth/login')

  redirect(`/${school}/admin`)
}
