import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyCoursesPage() {
  await redirectToSchoolPath('courses')
}
