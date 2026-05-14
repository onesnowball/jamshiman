import { RollingNumber } from '@/components/ui/RollingNumber'

export function PulseStatsCard({
  title,
  value,
  decimals = 0,
  suffix,
  subtitle,
  emoji,
}: {
  title: string
  value: number | null | undefined
  decimals?: number
  suffix?: string
  subtitle?: string
  emoji?: string
}) {
  return (
    <div className="card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md duration-200">
      <p className="text-xs text-gray-500 flex items-center gap-1">{emoji && <span>{emoji}</span>}{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 tracking-tight">
        {value == null ? <span className="text-gray-300">—</span> : <RollingNumber value={value} decimals={decimals} suffix={suffix} />}
      </p>
      {subtitle && <p className="mt-1 text-[11px] text-gray-400">{subtitle}</p>}
    </div>
  )
}
