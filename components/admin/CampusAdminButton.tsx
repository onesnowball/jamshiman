'use client'

import { useState } from 'react'
import { ShieldPlus, ShieldMinus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CampusAdminButton({
  userId,
  universityId,
  isCampusAdmin,
}: {
  userId: string
  universityId: string
  isCampusAdmin: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await fetch('/api/admin/campus-admins', {
      method: isCampusAdmin ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, university_id: universityId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isCampusAdmin ? 'Remove campus admin' : 'Make campus admin'}
      className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
        isCampusAdmin
          ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-white hover:border-gray-200 hover:text-gray-500'
          : 'bg-white border-gray-200 text-gray-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700'
      }`}
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : isCampusAdmin
          ? <ShieldMinus className="w-3 h-3" />
          : <ShieldPlus className="w-3 h-3" />
      }
      {isCampusAdmin ? 'Admin' : 'Make admin'}
    </button>
  )
}
