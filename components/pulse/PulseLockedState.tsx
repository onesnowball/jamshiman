import { EmptyStateIllustration } from '@/components/brand/EmptyStateIllustration'

export function PulseLockedState() {
  return (
    <div className="card p-6">
      <EmptyStateIllustration
        variant="pulse_locked"
        title="Today's stats are hidden until you check in 🫧"
        body="This keeps Grad Pulse useful instead of lurker-only. Anonymous aggregate stats unlock the moment you contribute."
      />
    </div>
  )
}
