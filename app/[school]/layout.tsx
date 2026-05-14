import { notFound, redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { getUniversityBySlug } from '@/lib/school'
import { getOptionalViewer } from '@/lib/server-auth'
import { isOnboarded } from '@/lib/onboarding'

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { school: string }
}) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()
  const viewer = await getOptionalViewer()
  if (viewer && !isOnboarded(viewer as any)) redirect('/profile/onboarding')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar school={params.school} />
      {children}
    </div>
  )
}
