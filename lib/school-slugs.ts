/**
 * URL slugs are not always the first piece of a university domain.
 * Keep the mapping in one client-safe module so redirects, nav, and API
 * responses agree on the same canonical school path.
 *
 * Domains listed here get a stable path segment (e.g. illinois.edu → "uiuc",
 * not "illinois"). Other schools fall back to the first label of the domain
 * (e.g. umich.edu → "umich").
 */
export const SLUG_TO_DOMAIN: Record<string, string> = {
  uiuc: 'illinois.edu',
}

export const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  '_next',
  'admin',
  'advisors',
  'api',
  'auth',
  'boards',
  'courses',
  'departments',
  'messages',
  'profile',
  'schedule',
])

/** Preferred URL slug for each domain key in SLUG_TO_DOMAIN (last slug wins if duplicated). */
const DOMAIN_TO_CANONICAL_SLUG: Record<string, string> = {}
for (const [slug, domain] of Object.entries(SLUG_TO_DOMAIN)) {
  DOMAIN_TO_CANONICAL_SLUG[domain] = slug
}

export function normalizeSchoolSlug(slug: string): string {
  return slug.trim().toLowerCase()
}

export function slugToDomain(slugOrDomain: string): string {
  const normalized = normalizeSchoolSlug(slugOrDomain)
  if (normalized.includes('.')) return normalized
  return SLUG_TO_DOMAIN[normalized] ?? `${normalized}.edu`
}

export function domainToSlug(domain: string): string {
  const normalized = domain.trim().toLowerCase()
  return DOMAIN_TO_CANONICAL_SLUG[normalized] ?? normalized.split('.')[0]
}

export function canonicalSchoolSlug(slugOrDomain: string): string {
  return domainToSlug(slugToDomain(slugOrDomain))
}

export function isSchoolPathSlug(segment: string): boolean {
  return /^[a-z]+$/.test(segment) && !RESERVED_TOP_LEVEL_SEGMENTS.has(segment)
}

export function canonicalSchoolPathSlug(slugOrDomain?: string | null): string | null {
  if (!slugOrDomain) return null

  const canonicalSlug = canonicalSchoolSlug(slugOrDomain)
  return isSchoolPathSlug(canonicalSlug) ? canonicalSlug : null
}
