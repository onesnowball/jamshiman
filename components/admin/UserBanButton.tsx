'use client'

import { useState } from 'react'
import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserBanButton({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_banned: !isBanned }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
        isBanned
          ? 'bg-white border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
          : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
      }`}
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : isBanned
          ? <ShieldCheck className="w-3 h-3" />
          : <ShieldOff className="w-3 h-3" />
      }
      {isBanned ? 'Unsuspend' : 'Suspend'}
    </button>
  )
}
