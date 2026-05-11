import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { FlagActions } from './FlagActions'
import { PendingDeleteActions } from './PendingDeleteActions'
import { ArchiveActions } from './ArchiveActions'
import { Shield, AlertTriangle, Trash2, Archive } from 'lucide-react'
import { getAdminViewer } from '@/lib/server-auth'
import type { FlagContentType } from '@/lib/content'

type FlagPreview = {
  headline: string
  body: string
}

async function getFlagPreview(
  supabase: ReturnType<typeof createAdminClient>,
  contentType: FlagContentType,
  contentId: string
): Promise<FlagPreview> {
  if (contentType === 'review') {
    const { data } = await supabase
      .from('advisor_reviews')
      .select('anonymized_text, advisors(name)')
      .eq('id', contentId)
      .single()
    return {
      headline: ((data as { advisors?: { name?: string } | null } | null)?.advisors?.name ?? 'Advisor review'),
      body: (data as { anonymized_text?: string } | null)?.anonymized_text ?? 'Review text unavailable.',
    }
  }

  if (contentType === 'course_review') {
    const { data } = await supabase
      .from('course_reviews')
      .select('anonymized_text, courses(code, name)')
      .eq('id', contentId)
      .single()
    const course = (data as { courses?: { code?: string; name?: string } | null } | null)?.courses
    return {
      headline: course ? `${course.code} · ${course.name}` : 'Course review',
      body: (data as { anonymized_text?: string } | null)?.anonymized_text ?? 'Review text unavailable.',
    }
  }

  if (contentType === 'post') {
    const { data } = await supabase
      .from('posts')
      .select('title, body')
      .eq('id', contentId)
      .single()
    return {
      headline: (data as { title?: string } | null)?.title ?? 'Board post',
      body: (data as { body?: string } | null)?.body ?? 'Post body unavailable.',
    }
  }

  const { data } = await supabase
    .from('comments')
    .select('body')
    .eq('id', contentId)
    .single()

  return {
    headline: 'Board comment',
    body: (data as { body?: string } | null)?.body ?? 'Comment body unavailable.',
  }
}

type ContentRow = {
  id: string
  title?: string
  body?: string
  created_at: string
  dept_id?: string
  post_id?: string
}

export default async function AdminFlagsPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()

  // ── 1. Pending flags ──────────────────────────────────────────────────────
  const { data: flagsData } = await supabase
    .from('flags')
    .select(`
      *,
      reporter:reporter_id(id),
      resolved_by_user:resolved_by(id)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  const flags = (flagsData ?? []) as Array<{
    id: string
    content_type: FlagContentType
    content_id: string
    reason: string
    notes: string | null
    created_at: string
  }>
  const flaggedItems = await Promise.all(flags.map(async flag => ({
    ...flag,
    preview: await getFlagPreview(supabase, flag.content_type, flag.content_id),
  })))

  // ── 2. Pending delete requests ────────────────────────────────────────────
  const [{ data: pendingPostsData }, { data: pendingCommentsData }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, body, created_at, dept_id')
      .eq('status', 'pending_delete')
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select('id, body, created_at, post_id')
      .eq('status', 'pending_delete')
      .order('created_at', { ascending: false }),
  ])
  const pendingPosts = (pendingPostsData ?? []) as ContentRow[]
  const pendingComments = (pendingCommentsData ?? []) as ContentRow[]

  // ── 3. Archived content ───────────────────────────────────────────────────
  const [{ data: archivedPostsData }, { data: archivedCommentsData }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, body, created_at, dept_id')
      .eq('status', 'archived')
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select('id, body, created_at, post_id')
      .eq('status', 'archived')
      .order('created_at', { ascending: false }),
  ])
  const archivedPosts = (archivedPostsData ?? []) as ContentRow[]
  const archivedComments = (archivedCommentsData ?? []) as ContentRow[]

  const pendingTotal = pendingPosts.length + pendingComments.length
  const archivedTotal = archivedPosts.length + archivedComments.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Flagged content ── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-semibold text-gray-900">Flagged content</h1>
            {flaggedItems.length > 0 && (
              <span className="badge-red">{flaggedItems.length} pending</span>
            )}
          </div>

          {!flaggedItems.length ? (
            <div className="card p-10 text-center text-gray-400">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No pending flags. All clear.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedItems.map((flag: any) => (
                <div key={flag.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800 capitalize">
                          {flag.content_type} flagged
                        </span>
                        <span className="badge-amber capitalize">{flag.reason}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Content ID: <code className="font-mono bg-gray-50 px-1 rounded">{flag.content_id}</code>
                      </p>
                      {flag.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">
                          "{flag.notes}"
                        </p>
                      )}
                      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">{flag.preview.headline}</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {flag.preview.body}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Reported {new Date(flag.created_at).toLocaleString()}
                      </p>
                    </div>
                    <FlagActions flagId={flag.id} contentType={flag.content_type} contentId={flag.content_id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Pending deletion requests ── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Pending deletion requests</h2>
            {pendingTotal > 0 && (
              <span className="badge-amber">{pendingTotal} pending</span>
            )}
          </div>

          {!pendingTotal ? (
            <div className="card p-10 text-center text-gray-400">
              <Trash2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No pending deletion requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map(post => (
                <div key={post.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="badge-amber">Post</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{post.title ?? 'Untitled'}</p>
                      </div>
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{post.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Requested {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                    <PendingDeleteActions contentType="post" contentId={post.id} />
                  </div>
                </div>
              ))}

              {pendingComments.map(comment => (
                <div key={comment.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="badge-amber">Comment</span>
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{comment.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Requested {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <PendingDeleteActions contentType="comment" contentId={comment.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Archived content ── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Archive className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">Archived content</h2>
            {archivedTotal > 0 && (
              <span className="badge-gray">{archivedTotal} archived</span>
            )}
          </div>

          {!archivedTotal ? (
            <div className="card p-10 text-center text-gray-400">
              <Archive className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No archived content.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedPosts.map(post => (
                <div key={post.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="badge-gray">Post</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{post.title ?? 'Untitled'}</p>
                      </div>
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{post.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Archived · {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                    <ArchiveActions contentType="post" contentId={post.id} />
                  </div>
                </div>
              ))}

              {archivedComments.map(comment => (
                <div key={comment.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="badge-gray">Comment</span>
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{comment.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Archived · {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <ArchiveActions contentType="comment" contentId={comment.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
