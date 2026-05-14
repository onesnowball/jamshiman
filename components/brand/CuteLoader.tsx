import { JamMascot } from './JamMascot'

export function CuteLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6" role="status" aria-live="polite">
      <JamMascot state="loading" size="md" />
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
