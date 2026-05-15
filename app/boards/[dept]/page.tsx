import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyBoardDeptPage({ params }: { params: { dept: string } }) {
  await redirectToSchoolPath(`boards/${params.dept}`)
}
