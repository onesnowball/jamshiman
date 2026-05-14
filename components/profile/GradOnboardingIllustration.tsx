import { JamMascot } from '@/components/brand/JamMascot'

export function GradOnboardingIllustration() {
  return (
    <div className="flex flex-col items-center gap-2">
      <JamMascot state="default" size="xl" />
      <p className="text-xs text-gray-400">your tiny grad survival friend</p>
    </div>
  )
}
