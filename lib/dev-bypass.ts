import { createHash } from 'crypto'
import { cookies } from 'next/headers'

export const DEV_BYPASS_COOKIE = 'jamshiman-dev-bypass'

export function isDevBypassEnabled() {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
}

export function getDevBypassEmail() {
  return (
    process.env.DEV_BYPASS_EMAIL
    ?? process.env.ADMIN_EMAILS?.split(',')[0]?.trim()
    ?? 'dev-admin@umich.edu'
  ).toLowerCase()
}

export function getDevBypassPassword() {
  return process.env.DEV_BYPASS_PASSWORD
}

export function getDevBypassEmailHash() {
  return createHash('sha256').update(getDevBypassEmail()).digest('hex')
}

export function hasDevBypassCookie() {
  return isDevBypassEnabled() && cookies().get(DEV_BYPASS_COOKIE)?.value === '1'
}
