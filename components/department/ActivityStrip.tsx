// 12-week activity strip for department pages, GitHub-contrib-graph style.
//
// Suppression: renders nothing if fewer than 3 of the last 12 weeks have any
// activity. The "Last activity" line above carries the whole story in that
// case, and a sparse strip would read worse than no strip.
//
// "Count" per week = posts + comments + course reviews + advisor reviews,
// all scoped to this department, status='active' only. A post with 5
// comments contributes 6 to that week.

import type { WeeklyBucket } from '@/lib/department-activity'

const CELL = 12      // px
const GAP = 3        // px
const CELLS = 12

function bucketColor(count: number): string {
  if (count === 0) return '#F3F4F6'  // gray-100
  if (count === 1) return '#DBEAFE'  // blue-100
  if (count <= 3)  return '#93C5FD'  // blue-300
  if (count <= 7)  return '#3B82F6'  // blue-500
  return '#1E40AF'                   // blue-800
}

function fmtTooltip(week: string, count: number): string {
  return `Week of ${week}: ${count} ${count === 1 ? 'item' : 'items'}`
}

export function ActivityStrip({ weeks }: { weeks: WeeklyBucket[] }) {
  const activeWeeks = weeks.filter(w => w.count > 0).length
  if (activeWeeks < 3) return null

  const width = CELLS * CELL + (CELLS - 1) * GAP
  const height = CELL

  return (
    <div className="inline-flex items-center gap-2 mt-1.5" aria-label="Activity in the last 12 weeks">
      <svg width={width} height={height} role="img">
        {weeks.map((w, i) => (
          <rect
            key={w.week}
            x={i * (CELL + GAP)}
            y={0}
            width={CELL}
            height={CELL}
            rx={2}
            fill={bucketColor(w.count)}
          >
            <title>{fmtTooltip(w.week, w.count)}</title>
          </rect>
        ))}
      </svg>
      <span className="text-[10px] text-gray-400">12 weeks</span>
    </div>
  )
}
