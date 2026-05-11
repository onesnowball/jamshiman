import { redirect } from 'next/navigation'
import { Users, ShieldOff, Shield } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { getAdminUniversity } from '@/lib/admin-context'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { UserBanButton } from '@/components/admin/UserBanButton'
import { CampusAdminButton } from '@/components/admin/CampusAdminButton'
import type { User } from '@/types/database'

export default async function AdminUsersPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await getAdminUniversity(viewer)
  if (!university) redirect('/admin')

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  // Fetch all users for this university
  const { data: usersData } = await supabase
    .from('users')
    .select('*')
    .eq('university_id', university.id)
    .order('created_at', { ascending: false })

  const users = (usersData ?? []) as User[]

  // Fetch campus admins for this university
  const { data: campusAdminsData } = await (supabase as any)
    .from('campus_admins')
    .select('user_id')
    .eq('university_id', university.id)

  const campusAdminIds = new Set(
    ((campusAdminsData ?? []) as Array<{ user_id: string }>).map(r => r.user_id)
  )

  // Real email map for global admin
  const allUserIds = users.map(u => u.id)
  const emailMap = isGlobalAdmin ? await getAuthEmailMap(allUserIds) : new Map<string, string>()

  function getDisplayLabel(u: User): string {
    if (isGlobalAdmin) {
      const email = emailMap.get(u.id)
      return email ? toPublicHandle(email) : u.email_hash.slice(0, 12)
    }
    return u.email_hash.slice(0, 8) + '…'
  }

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
              activeUsers.map(u => {
                const isCampusAdmin = campusAdminIds.has(u.id)
                const isGlobal = u.role === 'admin'
                return (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 font-mono truncate">
                          {getDisplayLabel(u)}
                        </p>
                        {isGlobal && (
                          <span className="badge-red text-[10px]">Global admin</span>
                        )}
                        {!isGlobal && isCampusAdmin && (
                          <span className="badge-purple text-[10px]">Campus admin</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Actions — only global admin can manage admins */}
                    {u.id !== viewer.id && !isGlobal && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isGlobalAdmin && (
                          <CampusAdminButton
                            userId={u.id}
                            universityId={university.id}
                            isCampusAdmin={isCampusAdmin}
                          />
                        )}
                        <UserBanButton userId={u.id} isBanned={false} />
                      </div>
                    )}
                  </div>
                )
              })
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
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500 font-mono truncate line-through">
                      {getDisplayLabel(u)}
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
