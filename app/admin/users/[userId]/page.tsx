import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, MessageSquare, Shield, ShieldOff } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer, canAdminUniversity } from '@/lib/server-auth'
import { getAdminUniversity } from '@/lib/admin-context'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { UserBanButton } from '@/components/admin/UserBanButton'
import { CampusAdminButton } from '@/components/admin/CampusAdminButton'
import type { User } from '@/types/database'

export default async function AdminUserDetailPage({
  params,
}: { params: { userId: string } }) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await getAdminUniversity(viewer)
  if (!university) redirect('/admin')

  const supabase = createAdminClient()
  const isGlobalAdmin = viewer.role === 'admin'

  // Load the target user
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.userId)
    .eq('university_id', university.id) // scoped to current university
    .single()

  const user = userData as User | null
  if (!user || !canAdminUniversity(viewer, user.university_id)) redirect('/admin/users')

  // Real email handle for global admin
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

  // Posts by this user (active + archived + pending_delete)
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

  // Comments by this user
  const { data: commentsData } = await (supabase as any)
    .from('comments')
    .select('id, body, created_at, status, post_id, posts(title, dept_id, departments(slug))')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const comments = (commentsData ?? []) as Array<{
    id: string; body: string; created_at: string; status: string
    post_id: string
    posts: { title: string; departments: { slug: string } | null } | null
  }>

  // Derive the school slug from the university domain (e.g. "umich.edu" → "umich")
  const schoolSlug = university.domain.replace('.edu', '')

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
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/admin/users" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
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

          {/* Actions */}
          {user.id !== viewer.id && user.role !== 'admin' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isGlobalAdmin && (
                <CampusAdminButton
                  userId={user.id}
                  universityId={university.id}
                  isCampusAdmin={isCampusAdmin}
                />
              )}
              <UserBanButton userId={user.id} isBanned={user.is_banned} />
            </div>
          )}
        </div>

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
                    <div className="flex items-center gap-1.5">
                      {statusBadge(comment.status)}
                    </div>
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
