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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function detroitDateParts(d: Date): { y: number; m: number; day: number; dow: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(d)
  const y = Number(parts.find(p => p.type === 'year')?.value ?? '0')
  const m = Number(parts.find(p => p.type === 'month')?.value ?? '0')
  const day = Number(parts.find(p => p.type === 'day')?.value ?? '0')
  const wd = parts.find(p => p.type === 'weekday')?.value ?? 'Sun'
  return { y, m, day, dow: WEEKDAYS.indexOf(wd) }
}

/** YYYY-MM-DD of the Monday of the Detroit ISO week containing `d`. */
export function getDetroitWeekStart(d: Date = new Date()): string {
  const { y, m, day, dow } = detroitDateParts(d)
  const daysToMonday = (dow + 6) % 7 // Mon=0 ... Sun=6
  const anchor = new Date(Date.UTC(y, m - 1, day - daysToMonday, 12, 0, 0))
  const wp = detroitDateParts(anchor)
  return `${wp.y}-${String(wp.m).padStart(2, '0')}-${String(wp.day).padStart(2, '0')}`
}

/** Last `n` Detroit week-starts (YYYY-MM-DD), oldest first, current week last. */
export function getRecentDetroitWeekStarts(n = 12, now: Date = new Date()): string[] {
  const out: string[] = []
  let cursor = getDetroitWeekStart(now)
  for (let i = 0; i < n; i++) {
    out.unshift(cursor)
    const [y, m, day] = cursor.split('-').map(Number)
    cursor = getDetroitWeekStart(new Date(Date.UTC(y, m - 1, day - 7, 12, 0, 0)))
  }
  return out
}
