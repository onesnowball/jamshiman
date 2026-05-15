import { redirectToSchoolPath } from '@/lib/legacy-redirect'

export default async function LegacyAdvisorsPage() {
  await redirectToSchoolPath('advisors')
}
