import { JamMascot } from '@/components/brand/JamMascot'

export function GradOnboardingIllustration() {
  return (
    <div className="flex flex-col items-center gap-2">
      <JamMascot state="default" size="xl" />
      <p className="text-xs text-gray-400">jamshiman · &ldquo;just a moment&rdquo; in Persian ✨</p>
    </div>
  )
}
