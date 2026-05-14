import { notFound } from 'next/navigation'
import { requireOnboardedViewer } from '@/lib/onboarding'
import { getUniversityBySlug } from '@/lib/school'
import { PulseDashboardClient } from '@/components/pulse/PulseDashboardClient'

export const dynamic = 'force-dynamic'

export default async function PulsePage({ params }: { params: { school: string } }) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()
  const viewer = await requireOnboardedViewer()
  if (viewer.university_id !== university.id) notFound()

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">How cooked are you today? 🔥</h1>
        <p className="text-sm text-gray-500 mt-1">Check in anonymously to unlock today&apos;s {university.name} grad pulse.</p>
      </div>
      <PulseDashboardClient schoolSlug={params.school} />
    </main>
  )
}
