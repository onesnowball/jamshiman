import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyCourseDetailPage({ params }: { params: { id: string } }) {
  await redirectToSchoolPath(`courses/${params.id}`)
}
