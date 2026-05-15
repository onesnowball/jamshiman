import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyAdvisorDetailPage({ params }: { params: { id: string } }) {
  await redirectToSchoolPath(`advisors/${params.id}`)
}
