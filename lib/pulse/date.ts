// America/Detroit day boundary helpers.
// Detroit is on Eastern Time (handles EDT/EST DST automatically via Intl).

const TZ = 'America/Detroit'

export function getDetroitTodayDateString(now: Date = new Date()): string {
  // en-CA gives YYYY-MM-DD format
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(now)
}

/** ISO timestamp at end-of-day (23:59:59.999) Detroit-local for a YYYY-MM-DD date. */
export function getDetroitEndOfDay(dateStr: string): Date {
  // Parse YYYY-MM-DD, treat as Detroit-local midnight, add 1 day - 1ms.
  // Use the local offset for that date by formatting noon-UTC and reading parts back.
  const [y, m, d] = dateStr.split('-').map(Number)
  // Find the UTC time that corresponds to Detroit midnight on that date.
  // We probe by starting at UTC midnight then adjusting by the timezone offset.
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const detroitFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit'
  }).formatToParts(probe)
  const hour = Number(detroitFmt.find(p => p.type === 'hour')?.value ?? '12')
  const offsetHours = 12 - hour // how many hours UTC is ahead of Detroit at noon-UTC
  // Detroit midnight in UTC = UTC midnight + offsetHours
  const detroitMidnightUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) + offsetHours * 3600_000
  return new Date(detroitMidnightUtcMs + 24 * 3600_000 - 1)
}

/** A check-in for `checkinDate` (YYYY-MM-DD) can be edited until Detroit midnight of that day. */
export function canEditCheckin(checkinDate: string, now: Date = new Date()): boolean {
  return getDetroitTodayDateString(now) === checkinDate
}
