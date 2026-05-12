import { redirect } from 'next/navigation'
import { getAdminFallbackSlug } from '@/lib/admin-context'
import { getAdminViewer } from '@/lib/server-auth'

export default async function LegacyAdminPathRedirectPage({
  params,
}: {
  params: { path: string[] }
}) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const school = await getAdminFallbackSlug(viewer)
  if (!school) redirect('/auth/login')

  redirect(`/${school}/admin/${params.path.join('/')}`)
}
