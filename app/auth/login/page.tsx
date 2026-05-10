'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { GraduationCap, Mail, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react'
import {
  getPublicAllowedSchoolDomains,
  getPublicPrimarySchoolDomain,
  getSchoolEmailPlaceholder,
  isAllowedSchoolEmail,
  normalizeEmail,
} from '@/lib/auth'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const devBypassEnabled = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  const allowedDomains = getPublicAllowedSchoolDomains()
  const primaryDomain = getPublicPrimarySchoolDomain()

  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (!errorCode) return

    const errorMessages: Record<string, string> = {
      auth_failed: 'The sign-in link could not be verified. Please request a new one and try again.',
      invalid_domain: 'This email domain is not configured for the app yet.',
      missing_token: 'The sign-in link was incomplete. Please request a new email link.',
      profile_failed: 'Your account was verified, but the user profile setup failed. Please try again.',
    }

    setStatus('error')
    setError(errorMessages[errorCode] ?? 'Sign-in failed. Please try again.')
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('idle')

    const normalizedEmail = normalizeEmail(email)
    if (!isAllowedSchoolEmail(normalizedEmail, allowedDomains)) {
      setError(`Only ${allowedDomains.map(domain => `@${domain}`).join(', ')} email addresses are accepted.`)
      return
    }

    setStatus('loading')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (authError) {
      setError(authError.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  async function handleDevLogin() {
    setIsDevLoggingIn(true)
    setError('')
    setStatus('idle')

    try {
      const res = await fetch('/api/dev-login', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Dev login failed.')
      window.location.href = '/admin'
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
          <p className="text-gray-500 text-sm mt-1">Everytime-style campus community, starting with grad students</p>
        </div>

        <div className="card p-6">
          {status === 'sent' ? (
            <div className="text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <h2 className="font-medium text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a sign-in link to <strong>{email}</strong>. Click it to continue.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail('') }}
                className="text-sm text-brand-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="section-label">University email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={getSchoolEmailPlaceholder()}
                    required
                    className="input pl-9"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Only {allowedDomains.map(domain => `@${domain}`).join(', ')} addresses accepted.
                </p>
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
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                  : 'Send sign-in link'
                }
              </button>
            </form>
          )}

          {devBypassEnabled && status !== 'sent' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
                Dev bypass is enabled locally. This creates or updates a dev admin user and signs you in without email.
              </div>
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={isDevLoggingIn}
                className="btn-secondary w-full justify-center py-2.5"
              >
                {isDevLoggingIn
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in as dev admin...</>
                  : <><Shield className="w-4 h-4" /> Continue as dev admin</>
                }
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Starting at {primaryDomain === 'umich.edu' ? 'UMich' : primaryDomain} with anonymous, verified reviews for grad students.
          <br />No passwords. No tracking. Just honest information.
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
