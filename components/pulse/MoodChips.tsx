'use client'

import { MOODS, MOOD_LABELS, type Mood } from '@/lib/pulse/options'

export function MoodChips({ value, onChange }: { value: Mood | null; onChange: (m: Mood) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOODS.map(m => {
        const active = value === m
        const meta = MOOD_LABELS[m]
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`px-2.5 py-1.5 rounded-full text-xs border transition-all active:scale-[0.96] ${
              active ? 'bg-brand-50 border-brand-300 text-brand-800 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-1">{meta.emoji}</span>{meta.label}
          </button>
        )
      })}
    </div>
  )
}
