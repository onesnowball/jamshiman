import { redirect } from 'next/navigation'
import { getOptionalViewer } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { isOnboarded } from '@/lib/onboarding'
import { GradOnboardingForm } from '@/components/profile/GradOnboardingForm'
import { GradOnboardingIllustration } from '@/components/profile/GradOnboardingIllustration'
import { SignOutButton } from '@/components/profile/SignOutButton'
import type { AcademicStatus } from '@/lib/pulse/options'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')
  if (isOnboarded(viewer as any)) redirect('/profile')

  const supabase = createAdminClient()
  const { data: deptData } = await supabase
    .from('departments')
    .select('id, name')
    .eq('university_id', viewer.university_id)
    .eq('active', true)
    .eq('is_board_category', false)
    .order('name')

  const departments = (deptData ?? []) as { id: string; name: string }[]

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-8 space-y-4">
          <GradOnboardingIllustration />
          <h1 className="text-2xl font-semibold text-gray-900">Welcome to jamshiman 🌙</h1>
          <p className="text-sm text-gray-500">A tiny anonymous corner for UMich grad students trying to survive beautifully.</p>
        </div>

        <div className="card p-6">
          <GradOnboardingForm
            departments={departments}
            currentHandle={viewer.handle}
            defaultDeptId={viewer.dept_id ?? null}
            defaultAcademicStatus={(viewer as any).academic_status as AcademicStatus | null}
          />
        </div>

        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed text-center">
          We do not ask for your lab, advisor, cohort, or exact research group. Your profile is only used to keep jamshiman stats anonymous and meaningful. UMich email verifies school membership — graduate status is self-attested.
        </p>

        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </main>
    </div>
  )
}
