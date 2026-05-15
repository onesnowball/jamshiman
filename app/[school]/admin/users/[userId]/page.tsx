import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, MessageSquare, Shield, AlertTriangle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { UserBanButton } from '@/components/admin/UserBanButton'
import { CampusAdminButton } from '@/components/admin/CampusAdminButton'
import { SuspensionRequestButton } from '@/components/admin/SuspensionRequestButton'
import { SuspensionReviewButtons } from '@/components/admin/SuspensionReviewButtons'
import type { User } from '@/types/database'

import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminUserDetailPage({
  params,
}: { params: { school: string; userId: string } }) {
  noStore()
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await requireAdminUniversity(viewer, params.school)

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  // Target user (must belong to this university)
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.userId)
    .eq('university_id', university.id)
    .single()

  const user = userData as User | null
  if (!user || !canAdminUniversity(viewer, user.university_id)) redirect(`/${params.school}/admin/users`)

  const emailMap = isGlobalAdmin ? await getAuthEmailMap([user.id]) : new Map<string, string>()
  const handle = isGlobalAdmin
    ? toPublicHandle(emailMap.get(user.id))
    : user.email_hash.slice(0, 8) + '…'

  // Campus admin status
  const { data: campusAdminRow } = await (supabase as any)
    .from('campus_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('university_id', university.id)
    .maybeSingle()
  const isCampusAdmin = !!campusAdminRow

  // Pending suspension request for this user
  const { data: suspReqRow } = await (supabase as any)
    .from('suspension_requests')
    .select('*')
    .eq('target_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  const pendingSuspensionRequest = suspReqRow ?? null

  // Pending appeal from this user (only relevant if they're banned)
  const { data: appealRow } = await (supabase as any)
    .from('suspension_appeals')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  const pendingAppeal = appealRow ?? null

  // Posts
  const { data: postsData } = await (supabase as any)
    .from('posts')
    .select('id, title, body, created_at, status, dept_id, departments(name, slug)')
    .eq('author_id', user.id)
    .eq('university_id', university.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const posts = (postsData ?? []) as Array<{
    id: string; title: string; body: string; created_at: string; status: string
    departments: { name: string; slug: string } | null
  }>

  // Comments
  const { data: commentsData } = await (supabase as any)
    .from('comments')
    .select('id, body, created_at, status, post_id, posts(title, departments(slug))')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const comments = (commentsData ?? []) as Array<{
    id: string; body: string; created_at: string; status: string
    post_id: string
    posts: { title: string; departments: { slug: string } | null } | null
  }>

  const schoolSlug = params.school

  function statusBadge(status: string) {
    if (status === 'active') return null
    const map: Record<string, string> = {
      removed: 'badge-red', archived: 'badge-gray',
      pending_delete: 'badge-amber', flagged: 'badge-amber',
    }
    return <span className={`${map[status] ?? 'badge-gray'} ml-1`}>{status.replace('_', ' ')}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href={`/${params.school}/admin/users`} className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <h1 className="text-xl font-semibold text-gray-900 font-mono">{handle}</h1>
              {user.role === 'admin' && <span className="badge-red">Global admin</span>}
              {isCampusAdmin && <span className="badge-purple">Campus admin</span>}
              {user.is_banned && <span className="badge-red">Suspended</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              · {posts.length} post{posts.length !== 1 ? 's' : ''}
              · {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions — only for non-admin users */}
          {user.id !== viewer.id && user.role !== 'admin' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isGlobalAdmin && (
                <CampusAdminButton
                  userId={user.id}
                  universityId={university.id}
                  isCampusAdmin={isCampusAdmin}
                />
              )}
              {/* Unsuspend is always direct; suspending goes through the request flow */}
              {user.is_banned ? (
                <UserBanButton userId={user.id} isBanned={true} />
              ) : (
                <SuspensionRequestButton
                  userId={user.id}
                  isGlobalAdmin={isGlobalAdmin}
                  hasPendingRequest={!!pendingSuspensionRequest}
                />
              )}
            </div>
          )}
        </div>

        {/* Pending suspension request — visible to global admins */}
        {pendingSuspensionRequest && isGlobalAdmin && (
          <div className="card p-5 border-amber-200 bg-amber-50 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-900">Suspension requested</h2>
              <span className="text-xs text-amber-600 ml-auto">
                {new Date(pendingSuspensionRequest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">{pendingSuspensionRequest.reason}</p>
            <SuspensionReviewButtons requestId={pendingSuspensionRequest.id} />
          </div>
        )}

        {/* Pending suspension request — visible to campus admins as status */}
        {pendingSuspensionRequest && !isGlobalAdmin && (
          <div className="card p-4 border-amber-200 bg-amber-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              A suspension request is pending global admin review.
            </p>
          </div>
        )}

        {/* Pending appeal — visible to global admins */}
        {pendingAppeal && isGlobalAdmin && (
          <div className="card p-5 border-brand-200 bg-brand-50 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-brand-900">Appeal submitted</h2>
              <span className="text-xs text-brand-600 ml-auto">
                {new Date(pendingAppeal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-brand-800 leading-relaxed">{pendingAppeal.reason}</p>
            <SuspensionReviewButtons appealId={pendingAppeal.id} userId={user.id} />
          </div>
        )}

        {/* Posts */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            Posts
            <span className="badge-gray">{posts.length}</span>
          </h2>
          {!posts.length ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-gray-400">No posts yet.</p>
            </div>
          ) : (
            <div className="card divide-y divide-gray-50 overflow-hidden">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/${schoolSlug}/boards/${post.departments?.slug ?? 'general'}/${post.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.departments?.name && (
                        <span className="badge-blue text-[10px]">{post.departments.name}</span>
                      )}
                      {statusBadge(post.status)}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1 group-hover:text-brand-700 transition-colors truncate">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{post.body}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0 pt-1">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Comments */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Comments
            <span className="badge-gray">{comments.length}</span>
          </h2>
          {!comments.length ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-gray-400">No comments yet.</p>
            </div>
          ) : (
            <div className="card divide-y divide-gray-50 overflow-hidden">
              {comments.map(comment => (
                <Link
                  key={comment.id}
                  href={`/${schoolSlug}/boards/${comment.posts?.departments?.slug ?? 'general'}/${comment.post_id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    {comment.posts?.title && (
                      <p className="text-xs text-brand-600 font-medium mb-1 truncate">
                        ↳ {comment.posts.title}
                      </p>
                    )}
                    {statusBadge(comment.status)}
                    <p className="text-sm text-gray-700 line-clamp-2 mt-0.5">{comment.body}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0 pt-1">
                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
