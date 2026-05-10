const DEFAULT_ALLOWED_SCHOOL_DOMAINS = ['umich.edu']

function parseDomains(raw: string | undefined) {
  const parsed = (raw ?? '')
    .split(',')
    .map(domain => domain.trim().toLowerCase())
    .filter(Boolean)

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_SCHOOL_DOMAINS
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getEmailDomain(email: string) {
  return normalizeEmail(email).split('@')[1] ?? ''
}

export function getAllowedSchoolDomains() {
  return parseDomains(
    process.env.ALLOWED_SCHOOL_DOMAINS
    ?? process.env.NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS
  )
}

export function getPublicAllowedSchoolDomains() {
  return parseDomains(process.env.NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS)
}

export function getPrimarySchoolDomain() {
  return getAllowedSchoolDomains()[0] ?? DEFAULT_ALLOWED_SCHOOL_DOMAINS[0]
}

export function getPublicPrimarySchoolDomain() {
  return getPublicAllowedSchoolDomains()[0] ?? DEFAULT_ALLOWED_SCHOOL_DOMAINS[0]
}

export function isAllowedSchoolEmail(email: string, domains = getAllowedSchoolDomains()) {
  return domains.includes(getEmailDomain(email))
}

export function getSchoolEmailPlaceholder() {
  return `you@${getPublicPrimarySchoolDomain()}`
}
