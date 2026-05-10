'use client'

import { useState } from 'react'
import { Loader2, Shield, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

type AccessRecord = {
  id: string
  email: string
  role: 'student' | 'admin'
  created_at: string
  degree_type: string | null
}

export function AccessManager({
  users,
  currentUserId,
}: {
  users: AccessRecord[]
  currentUserId: string
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function updateRole(userId: string, role: 'student' | 'admin') {
    setLoadingId(userId)
    setError('')

    try {
      const response = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update role.')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Could not update role.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {users.map(user => {
        const isCurrentUser = user.id === currentUserId
        const isLoading = loadingId === user.id

        return (
          <div key={user.id} className="card p-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{user.email}</p>
                <span className={user.role === 'admin' ? 'badge-blue' : 'badge-gray'}>
                  {user.role}
                </span>
                {isCurrentUser && <span className="badge-green">You</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Signed in {new Date(user.created_at).toLocaleDateString()}
                {user.degree_type ? ` · ${user.degree_type.toUpperCase()}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {user.role === 'admin' ? (
                <button
                  type="button"
                  disabled={isCurrentUser || isLoading}
                  onClick={() => updateRole(user.id, 'student')}
                  className="btn-secondary text-xs"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  Remove admin
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => updateRole(user.id, 'admin')}
                  className="btn-primary text-xs"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  Promote to admin
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
