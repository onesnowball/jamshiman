import { timeAgo } from '@/lib/format/relative-time'

/** Server-rendered "Last activity: X ago" line for department pages.
 *  Renders "No activity yet" when `lastActivity` is null. */
export function LastActivityLine({ lastActivity }: { lastActivity: Date | null }) {
  if (!lastActivity) {
    return <p className="text-xs text-gray-400">No activity yet</p>
  }
  return (
    <p className="text-xs text-gray-500">
      Last activity: <span className="text-gray-700 font-medium">{timeAgo(lastActivity)}</span>
    </p>
  )
}
