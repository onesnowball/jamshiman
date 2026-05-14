'use client'

export function StressSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
        aria-label="Stress level"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>1 chill</span>
        <span className="font-semibold text-gray-700">{value}/10</span>
        <span>10 cooked</span>
      </div>
    </div>
  )
}
