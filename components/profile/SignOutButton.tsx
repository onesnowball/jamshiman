'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onClick() {
    if (busy) return
    setBusy(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    // Clear any local hints
    try { document.cookie = 'last_school=; Max-Age=0; path=/' } catch {}
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
    >
      <LogOut className="w-3.5 h-3.5" />
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
