import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyBoardsPage() {
  await redirectToSchoolPath('boards')
}
