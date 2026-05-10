'use client'

import { useState } from 'react'
import { Loader2, Shield, ShieldOff, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

type AccessRecord = {
  id: string
  email: string
  role: 'student' | 'admin'
  created_at: string
  degree_type: string | null
  campusAdminUniversityIds: string[]
}

type University = { id: string; name: string; domain: string }

export function AccessManager({
  users,
  universities,
  currentUserId,
}: {
  users: AccessRecord[]
  universities: University[]
  currentUserId: string
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function updateRole(userId: string, role: 'student' | 'admin') {
    setLoadingId(userId + '-role')
    setError('')
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update role.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function toggleCampusAdmin(userId: string, universityId: string, isCurrent: boolean) {
    setLoadingId(userId + '-' + universityId)
    setError('')
    try {
      const res = await fetch('/api/admin/campus-admins', {
        method: isCurrent ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, university_id: universityId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {users.map(user => {
        const isCurrentUser = user.id === currentUserId
        const isGlobalAdmin = user.role === 'admin'

        return (
          <div key={user.id} className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <span className={isGlobalAdmin ? 'badge-blue' : 'badge-gray'}>{user.role}</span>
                  {isCurrentUser && <span className="badge-green">You</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Signed in {new Date(user.created_at).toLocaleDateString()}
                  {user.degree_type ? ` · ${user.degree_type.toUpperCase()}` : ''}
                </p>
              </div>

              {/* Global admin toggle */}
              {!isCurrentUser && (
                isGlobalAdmin ? (
                  <button
                    disabled={loadingId === user.id + '-role'}
                    onClick={() => updateRole(user.id, 'student')}
                    className="btn-secondary text-xs flex-shrink-0"
                  >
                    {loadingId === user.id + '-role' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                    Remove global admin
                  </button>
                ) : (
                  <button
                    disabled={loadingId === user.id + '-role'}
                    onClick={() => updateRole(user.id, 'admin')}
                    className="btn-primary text-xs flex-shrink-0"
                  >
                    {loadingId === user.id + '-role' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    Make global admin
                  </button>
                )
              )}
            </div>

            {/* Campus admin per university */}
            {!isGlobalAdmin && (
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-400 mb-2 font-medium">Campus admin</p>
                <div className="flex flex-wrap gap-2">
                  {universities.map(uni => {
                    const isCampusAdmin = user.campusAdminUniversityIds.includes(uni.id)
                    const key = user.id + '-' + uni.id
                    return (
                      <button
                        key={uni.id}
                        disabled={loadingId === key}
                        onClick={() => toggleCampusAdmin(user.id, uni.id, isCampusAdmin)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isCampusAdmin
                            ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600'
                        }`}
                      >
                        {loadingId === key
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : isCampusAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />
                        }
                        {uni.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
