import { redirect } from 'next/navigation'
import { getOptionalViewer } from '@/lib/server-auth'

export interface OnboardingFields {
  onboarding_completed?: boolean | null
  academic_status?: string | null
  dept_id?: string | null
}

export function isOnboarded(user: OnboardingFields | null | undefined): boolean {
  if (!user) return false
  return !!user.onboarding_completed && !!user.academic_status && !!user.dept_id
}

/** Server-side guard: require authed user with completed onboarding, else redirect. */
export async function requireOnboardedViewer() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')
  if (!isOnboarded(viewer)) redirect('/profile/onboarding')
  return viewer
}
