/**
 * URL slugs are not always the first piece of a university domain.
 * Keep the mapping in one client-safe module so redirects, nav, and API
 * responses agree on the same canonical school path.
 */
export const SLUG_TO_DOMAIN: Record<string, string> = {
  uiuc: 'illinois.edu',
}

const DOMAIN_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_DOMAIN).map(([slug, domain]) => [domain, slug])
)

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
  return DOMAIN_TO_SLUG[normalized] ?? normalized.split('.')[0]
}
