import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacySchedulePage() {
  await redirectToSchoolPath('schedule')
}
