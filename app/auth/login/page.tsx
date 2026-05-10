'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, Mail, AlertCircle, Loader2, Shield, KeyRound } from 'lucide-react'
import {
  getPublicAllowedSchoolDomains,
  getPublicPrimarySchoolDomain,
  getSchoolEmailPlaceholder,
  isAllowedSchoolEmail,
  normalizeEmail,
} from '@/lib/auth'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'verify' | 'verifying' | 'error'>('idle')
  const [error, setError] = useState('')
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const devBypassEnabled = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  const allowedDomains = getPublicAllowedSchoolDomains()
  const primaryDomain = getPublicPrimarySchoolDomain()

  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (!errorCode) return
    const errorMessages: Record<string, string> = {
      invalid_domain: 'This email domain is not allowed.',
      profile_failed: 'Account verified but profile setup failed. Please try again.',
    }
    setStatus('error')
    setError(errorMessages[errorCode] ?? 'Sign-in failed. Please try again.')
  }, [searchParams])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const normalizedEmail = normalizeEmail(email)
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
      type: 'email',
    })
    if (verifyError) {
      setError('Invalid or expired code. Request a new one.')
      setStatus('verify')
      return
    }
    router.push('/auth/setup')
  }

  async function handleDevLogin() {
    setIsDevLoggingIn(true)
    setError('')
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
          <p className="text-gray-500 text-sm mt-1">Campus community for grad students</p>
        </div>

        <div className="card p-6">
          {status === 'verify' || status === 'verifying' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-2">
                <KeyRound className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Enter your code</p>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to <strong>{email}</strong>
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
                    placeholder={getSchoolEmailPlaceholder()}
                    required
                    className="input pl-9"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Only {allowedDomains.map(d => `@${d}`).join(', ')} addresses accepted.
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
          {primaryDomain === 'umich.edu' ? 'UMich' : primaryDomain} grad students only.
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
