/**
 * Relative time formatter shared across the app. Single source of truth —
 * do not re-inline this on individual pages.
 *
 * Granularity descends: minutes → hours → days → weeks → months → years.
 * Things under a minute round up to "1m ago" so the smallest visible unit
 * is always a minute. (We never need "just now" anywhere in the product.)
 */
export function timeAgo(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const ms = Date.now() - date.getTime()
  const mins = ms / (1000 * 60)
  if (mins < 60)  return `${Math.max(1, Math.floor(mins))}m ago`
  const hrs = mins / 60
  if (hrs < 24)   return `${Math.floor(hrs)}h ago`
  const days = hrs / 24
  if (days < 7)   return `${Math.floor(days)}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/**
 * Coarser variant used on the department detail page's "Last activity" line.
 * "Last activity: today" reads better than "Last activity: 1m ago".
 */
export function timeAgoCoarse(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  if (days < 1)   return 'today'
  if (days < 7)   return `${Math.floor(days)}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/**
 * Compact, no-suffix variant for tight UI like conversation lists.
 * Falls back to a short date for anything older than a week.
 */
export function timeAgoCompact(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
