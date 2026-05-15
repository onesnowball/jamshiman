import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyNewPostPage() {
  await redirectToSchoolPath('boards/new')
}
