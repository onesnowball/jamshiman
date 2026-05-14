import { EmptyStateIllustration } from '@/components/brand/EmptyStateIllustration'

export function PulseLockedState() {
  return (
    <div className="card p-6">
      <EmptyStateIllustration
        variant="pulse_locked"
        title="Today's stats are hidden until you check in 🫧"
        body="Anonymous aggregate stats unlock the moment you contribute. Lurker-mode off, just for a moment ✨"
      />
    </div>
  )
}
