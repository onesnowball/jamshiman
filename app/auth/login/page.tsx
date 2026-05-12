'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Mail, AlertCircle, Loader2, Shield, KeyRound, AtSign } from 'lucide-react'
import {
  getPublicAllowedSchoolDomains,
  getPublicPrimarySchoolDomain,
  isAllowedSchoolEmail,
  normalizeEmail,
} from '@/lib/auth'
import { domainToSlug, slugToDomain } from '@/lib/school-slugs'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'verify' | 'verifying' | 'handle' | 'savingHandle' | 'error'>('idle')
  const [error, setError] = useState('')
  const [handle, setHandle] = useState('')
  const [handleError, setHandleError] = useState('')
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const devBypassEnabled = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  const allowedDomains = getPublicAllowedSchoolDomains()
  const primaryDomain = getPublicPrimarySchoolDomain()

  // If coming from the school picker, scope the UI to that school
  const schoolParam = searchParams.get('school')?.toLowerCase() ?? ''
  // Trust the URL param directly for display (email validation still enforces allowed domains on submit)
  const displayDomain = schoolParam ? slugToDomain(schoolParam) : primaryDomain
  const emailPlaceholder = `you@${displayDomain}`
  const schoolLabel: Record<string, string> = {
    'umich.edu': 'UMich',
    'northwestern.edu': 'Northwestern',
    'illinois.edu': 'UIUC',
  }

  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (!errorCode) return
    const errorMessages: Record<string, string> = {
      auth_failed: 'Session could not be verified. Please request a new code.',
      invalid_domain: 'This email domain is not allowed.',
      profile_failed: 'Account verified but profile setup failed. Please try again.',
      missing_token: 'Sign-in link was incomplete. Please request a new code.',
    }
    setStatus('error')
    setError(errorMessages[errorCode] ?? 'Sign-in failed. Please try again.')
  }, [searchParams])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const normalizedEmail = normalizeEmail(email)

    // H-11: Domain enforcement is server-side only. Client just validates against
    // the global allowed-domains list — no admin-email whitelist in the bundle.
    if (!isAllowedSchoolEmail(normalizedEmail, allowedDomains)) {
      setError(`Only ${allowedDomains.map(d => `@${d}`).join(', ')} addresses accepted.`)
      return
    }
    setStatus('loading')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
    })
    if (authError) {
      setError(authError.message)
      setStatus('error')
    } else {
      setStatus('verify')
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('verifying')
    const normalizedEmail = normalizeEmail(email)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code.trim(),
      type: 'magiclink',
    })
    if (verifyError) {
      setError(`Code error: ${verifyError.message}`)
      setStatus('verify')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Session not established. Please try again.')
      setStatus('verify')
      return
    }

    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error === 'invalid_domain'
        ? 'This email domain is not allowed.'
        : 'Profile setup failed. Please try again.'
      )
      setStatus('error')
      return
    }

    const json = await res.json()
    if (json.needsHandle) {
      setStatus('handle')
      return
    }

    const slug = schoolParam ? domainToSlug(displayDomain) : 'umich'
    window.location.href = `/${slug}/boards`
  }

  async function handleSetHandle(e: React.FormEvent) {
    e.preventDefault()
    setHandleError('')
    const trimmed = handle.trim().toLowerCase()
    if (trimmed.length < 3) {
      setHandleError('Handle must be at least 3 characters')
      return
    }
    setStatus('savingHandle')
    try {
      const res = await fetch('/api/profile/handle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setHandleError(data.error || 'Could not save handle. Try another.')
        setStatus('handle')
        return
      }
      const slug = schoolParam ? domainToSlug(displayDomain) : 'umich'
      window.location.href = `/${slug}/boards`
    } catch {
      setHandleError('Something went wrong. Please try again.')
      setStatus('handle')
    }
  }

  function skipHandle() {
    const slug = schoolParam ? domainToSlug(displayDomain) : 'umich'
    window.location.href = `/${slug}/boards`
  }

  async function handleDevLogin() {
    setIsDevLoggingIn(true)
    setError('')
    try {
      const res = await fetch('/api/dev-login', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Dev login failed.')
      const slug = schoolParam ? domainToSlug(displayDomain) : 'umich'
      window.location.href = `/${slug}/admin`
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Dev login failed.')
    } finally {
      setIsDevLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">jamshiman</h1>
          <p className="text-gray-500 text-sm mt-1">Campus community for students</p>
        </div>

        <div className="card p-6">
          {status === 'handle' || status === 'savingHandle' ? (
            <form onSubmit={handleSetHandle} className="space-y-4">
              <div className="text-center mb-2">
                <AtSign className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Choose a display name</p>
                <p className="text-sm text-gray-500 mt-1">
                  Shown when you post without anonymity. Lowercase letters, numbers, underscores (3–20 chars).
                </p>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value.replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                  placeholder="your_handle"
                  className="input pl-7"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  minLength={3}
                  maxLength={20}
                />
              </div>

              {handleError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {handleError}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'savingHandle' || handle.length < 3}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
              >
                {status === 'savingHandle'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : 'Continue'
                }
              </button>

              <button
                type="button"
                onClick={skipHandle}
                className="text-sm text-gray-400 hover:text-gray-600 w-full text-center py-1"
              >
                Skip for now
              </button>
            </form>
          ) : status === 'verify' || status === 'verifying' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-2">
                <KeyRound className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Enter your code</p>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a sign-in code to <strong>{email}</strong>
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="00000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl tracking-widest font-mono"
                autoFocus
              />

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'verifying' || code.length < 6 || code.length > 8}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
              >
                {status === 'verifying'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  : 'Verify code'
                }
              </button>

              <button
                type="button"
                onClick={() => { setStatus('idle'); setCode(''); setError('') }}
                className="text-sm text-brand-600 hover:underline w-full text-center"
              >
                Use a different email
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="section-label">University email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={emailPlaceholder}
                    required
                    className="input pl-9"
                  />
                </div>
              </div>

              {(status === 'error' || error) && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full justify-center py-2.5"
              >
                {status === 'loading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                  : 'Send sign-in code'
                }
              </button>
            </form>
          )}

          {devBypassEnabled && status !== 'verify' && status !== 'verifying' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
                Dev bypass enabled.
              </div>
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={isDevLoggingIn}
                className="btn-secondary w-full justify-center py-2.5"
              >
                {isDevLoggingIn
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  : <><Shield className="w-4 h-4" /> Continue as dev admin</>
                }
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {schoolLabel[displayDomain] ?? displayDomain} students only.
          No passwords. No tracking.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginPageContent />
    </Suspense>
  )
}
