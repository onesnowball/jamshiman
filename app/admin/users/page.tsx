import { redirect } from 'next/navigation'
import { Users, ShieldOff, Shield } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { getAdminUniversity } from '@/lib/admin-context'
import { UserBanButton } from '@/components/admin/UserBanButton'
import type { User } from '@/types/database'

export default async function AdminUsersPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await getAdminUniversity(viewer)
  if (!university) redirect('/admin')

  const supabase = createAdminClient()

  const { data: usersData } = await supabase
    .from('users')
    .select('*')
    .eq('university_id', university.id)
    .order('created_at', { ascending: false })

  const users = (usersData ?? []) as User[]

  const activeUsers = users.filter(u => !u.is_banned)
  const bannedUsers = users.filter(u => u.is_banned)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-6">

        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeUsers.length} active · {bannedUsers.length} suspended
            </p>
          </div>
        </div>

        {/* Active users */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Active members
          </h2>
          <div className="card overflow-hidden divide-y divide-gray-50">
            {activeUsers.length === 0 ? (
              <p className="text-sm text-gray-400 p-5">No active users yet.</p>
            ) : (
              activeUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-mono truncate">
                      {u.email_hash.slice(0, 12)}…
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {u.role === 'admin' && (
                        <span className="ml-2 text-red-500 font-medium">· Global admin</span>
                      )}
                    </p>
                  </div>
                  {u.id !== viewer.id && u.role !== 'admin' && (
                    <UserBanButton userId={u.id} isBanned={false} />
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Banned users */}
        {bannedUsers.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShieldOff className="w-4 h-4 text-red-400" />
              Suspended accounts
            </h2>
            <div className="card overflow-hidden divide-y divide-gray-50">
              {bannedUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-4 bg-red-50/40">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 font-mono truncate line-through">
                      {u.email_hash.slice(0, 12)}…
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <UserBanButton userId={u.id} isBanned={true} />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
