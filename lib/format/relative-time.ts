/** Relative time formatter shared across pages. */
export function timeAgo(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  if (days < 1)   return 'today'
  if (days < 7)   return `${Math.floor(days)}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
