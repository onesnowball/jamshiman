import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyCourseDiscussionPage({ params }: { params: { id: string; postId: string } }) {
  await redirectToSchoolPath(`courses/${params.id}/discussion/${params.postId}`)
}
