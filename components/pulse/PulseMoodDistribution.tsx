import { MOOD_LABELS, type Mood } from '@/lib/pulse/options'

export function PulseMoodDistribution({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts) as Array<[Mood, number]>
  const total = entries.reduce((s, [, n]) => s + n, 0)
  if (!total) {
    return <p className="text-xs text-gray-400">No moods recorded yet.</p>
  }
  return (
    <div className="space-y-2">
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([m, n]) => {
          const pct = (n / total) * 100
          const meta = MOOD_LABELS[m] ?? { emoji: '·', label: m }
          return (
            <div key={m} className="flex items-center gap-2">
              <span className="w-32 text-xs text-gray-600">{meta.emoji} {meta.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right text-[11px] text-gray-500">{n}</span>
            </div>
          )
        })}
    </div>
  )
}
