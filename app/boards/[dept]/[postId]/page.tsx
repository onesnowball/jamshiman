import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyBoardPostPage({ params }: { params: { dept: string; postId: string } }) {
  await redirectToSchoolPath(`boards/${params.dept}/${params.postId}`)
}
