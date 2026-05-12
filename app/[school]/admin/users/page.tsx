import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ShieldOff, Shield, AlertTriangle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { UserBanButton } from '@/components/admin/UserBanButton'
import { CampusAdminButton } from '@/components/admin/CampusAdminButton'
import { SuspensionReviewButtons } from '@/components/admin/SuspensionReviewButtons'
import type { User } from '@/types/database'

export default async function AdminUsersPage({ params }: { params: { school: string } }) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await requireAdminUniversity(viewer, params.school)

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  // Fetch all users for this university
  const { data: usersData } = await supabase
    .from('users')
    .select('*')
    .eq('university_id', university.id)
    .order('created_at', { ascending: false })

  const users = (usersData ?? []) as User[]

  // Campus admins for this university
  const { data: campusAdminsData } = await (supabase as any)
    .from('campus_admins')
    .select('user_id')
    .eq('university_id', university.id)

  const campusAdminIds = new Set(
    ((campusAdminsData ?? []) as Array<{ user_id: string }>).map(r => r.user_id)
  )

  // Pending suspension requests (global admin sees approve/deny; campus sees status)
  const { data: suspReqData } = await (supabase as any)
    .from('suspension_requests')
    .select('*')
    .eq('university_id', university.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const pendingRequests = (suspReqData ?? []) as Array<{
    id: string; target_user_id: string; requested_by: string; reason: string; created_at: string
  }>

  // Email map for all involved user IDs
  const allUserIds = users.map(u => u.id)
  const requestorIds = pendingRequests.map(r => r.requested_by)
  const emailMap = isGlobalAdmin
    ? await getAuthEmailMap(Array.from(new Set([...allUserIds, ...requestorIds])))
    : new Map<string, string>()

  const userMap = new Map(users.map(u => [u.id, u]))

  function getDisplayLabel(userId: string): string {
    const u = userMap.get(userId)
    if (!u) return userId.slice(0, 8) + '…'
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
      <main className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-6">

        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeUsers.length} active · {bannedUsers.length} suspended
              {pendingRequests.length > 0 && ` · ${pendingRequests.length} pending request${pendingRequests.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Pending suspension requests */}
        {pendingRequests.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Suspension requests
              <span className="badge-amber">{pendingRequests.length}</span>
            </h2>
            <div className="space-y-3">
              {pendingRequests.map(req => {
                const target = userMap.get(req.target_user_id)
                const targetLabel = getDisplayLabel(req.target_user_id)
                const requestorLabel = getDisplayLabel(req.requested_by)
                return (
                  <div key={req.id} className="card p-5 border-amber-100 bg-amber-50/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/${params.school}/admin/users/${req.target_user_id}`}
                            className="text-sm font-semibold text-gray-900 font-mono hover:text-brand-700 transition-colors"
                          >
                            {targetLabel}
                          </Link>
                          <span className="badge-amber text-[10px]">Suspension requested</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Requested by <span className="font-medium text-gray-700">{requestorLabel}</span>
                          {' · '}{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg px-3 py-2 border border-amber-100 mt-2">
                          {req.reason}
                        </p>
                      </div>
                    </div>
                    {isGlobalAdmin && (
                      <SuspensionReviewButtons requestId={req.id} />
                    )}
                    {!isGlobalAdmin && (
                      <p className="text-xs text-amber-700 font-medium">Awaiting global admin review</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

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
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-gray-50/80 transition-colors group">
                    <Link href={`/${params.school}/admin/users/${u.id}`} className="min-w-0 flex-1 block">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 font-mono truncate group-hover:text-brand-700 transition-colors">
                          {getDisplayLabel(u.id)}
                        </p>
                        {isGlobal && <span className="badge-red text-[10px]">Global admin</span>}
                        {!isGlobal && isCampusAdmin && <span className="badge-purple text-[10px]">Campus admin</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </Link>

                    {u.id !== viewer.id && !isGlobal && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isGlobalAdmin && (
                          <CampusAdminButton
                            userId={u.id}
                            universityId={university.id}
                            isCampusAdmin={isCampusAdmin}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Suspended users */}
        {bannedUsers.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShieldOff className="w-4 h-4 text-red-400" />
              Suspended accounts
            </h2>
            <div className="card overflow-hidden divide-y divide-gray-50">
              {bannedUsers.map(u => (
                <Link
                  key={u.id}
                  href={`/${params.school}/admin/users/${u.id}`}
                  className="flex items-center justify-between px-4 py-3 gap-4 bg-red-50/40 hover:bg-red-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500 font-mono truncate line-through group-hover:text-red-700 transition-colors">
                      {getDisplayLabel(u.id)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="badge-red text-[10px] flex-shrink-0">Suspended</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
