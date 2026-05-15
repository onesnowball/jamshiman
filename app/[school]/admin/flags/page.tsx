import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FlagActions } from './FlagActions'
import { PendingDeleteActions } from './PendingDeleteActions'
import { ArchiveActions } from './ArchiveActions'
import { Shield, AlertTriangle, Trash2, Archive, Users } from 'lucide-react'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import type { FlagContentType } from '@/lib/content'

import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FlagPreview = { headline: string; body: string }

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
      headline: (data as any)?.advisors?.name ?? 'Advisor review',
      body: (data as any)?.anonymized_text ?? 'Review text unavailable.',
    }
  }
  if (contentType === 'course_review') {
    const { data } = await supabase
      .from('course_reviews')
      .select('anonymized_text, courses(code, name)')
      .eq('id', contentId)
      .single()
    const course = (data as any)?.courses
    return {
      headline: course ? `${course.code} · ${course.name}` : 'Course review',
      body: (data as any)?.anonymized_text ?? 'Review text unavailable.',
    }
  }
  if (contentType === 'post') {
    const { data } = await supabase.from('posts').select('title, body').eq('id', contentId).single()
    return {
      headline: (data as any)?.title ?? 'Board post',
      body: (data as any)?.body ?? 'Post body unavailable.',
    }
  }
  const { data } = await supabase.from('comments').select('body').eq('id', contentId).single()
  return { headline: 'Board comment', body: (data as any)?.body ?? 'Comment body unavailable.' }
}

type ContentRow = { id: string; title?: string; body?: string; created_at: string; dept_id?: string; post_id?: string }

// Group individual flag rows by content_id — multiple reporters collapse into one card.
type FlagGroup = {
  contentId: string
  contentType: FlagContentType
  reportCount: number
  reasons: string[]
  latestNote: string | null
  latestAt: string
  preview: FlagPreview
}

export default async function AdminFlagsPage({ params }: { params: { school: string } }) {
  noStore()
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()

  const university = await requireAdminUniversity(viewer, params.school)

  const uniId = university.id

  // ── Scope content IDs to this university ────────────────────────────────
  const { data: uniPosts }    = await supabase.from('posts').select('id').eq('university_id', uniId)
  const postIds               = (uniPosts ?? []).map((p: any) => p.id as string)

  const { data: uniComments } = postIds.length
    ? await supabase.from('comments').select('id').in('post_id', postIds)
    : { data: [] }
  const commentIds = (uniComments ?? []).map((c: any) => c.id as string)

  const { data: uniAdvisors } = await supabase.from('advisors').select('id').eq('university_id', uniId)
  const advisorIds            = (uniAdvisors ?? []).map((a: any) => a.id as string)
  const { data: uniReviews }  = advisorIds.length
    ? await supabase.from('advisor_reviews').select('id').in('advisor_id', advisorIds)
    : { data: [] }
  const reviewIds = (uniReviews ?? []).map((r: any) => r.id as string)

  const scopedIds = [...postIds, ...commentIds, ...reviewIds]

  // ── 1. Pending flags ─────────────────────────────────────────────────────
  let flagQuery = (supabase as any)
    .from('flags')
    .select('content_type, content_id, reason, notes, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (scopedIds.length) flagQuery = flagQuery.in('content_id', scopedIds)

  const { data: flagsRaw } = await flagQuery
  const flagRows = (flagsRaw ?? []) as Array<{
    content_type: FlagContentType
    content_id: string
    reason: string
    notes: string | null
    created_at: string
  }>

  // Group by content_id
  const groupMap = new Map<string, typeof flagRows>()
  for (const row of flagRows) {
    const key = row.content_id
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(row)
  }

  const flagGroups: FlagGroup[] = await Promise.all(
    Array.from(groupMap.entries()).map(async ([contentId, rows]) => {
      const latest = rows[0]
      const reasons = Array.from(new Set(rows.map(r => r.reason)))
      const noteRow = rows.find(r => r.notes)
      return {
        contentId,
        contentType: latest.content_type,
        reportCount: rows.length,
        reasons,
        latestNote: noteRow?.notes ?? null,
        latestAt: latest.created_at,
        preview: await getFlagPreview(supabase, latest.content_type, contentId),
      }
    })
  )

  // ── 2. Pending deletion requests ─────────────────────────────────────────
  const [{ data: pendingPostsData }, { data: pendingCommentsData }] = await Promise.all([
    (supabase as any)
      .from('posts').select('id, title, body, created_at, dept_id')
      .eq('university_id', uniId).eq('status', 'pending_delete')
      .order('created_at', { ascending: false }),
    supabase
      .from('comments').select('id, body, created_at, post_id')
      .eq('status', 'pending_delete')
      .in('post_id', postIds.length ? postIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false }),
  ])
  const pendingPosts    = (pendingPostsData ?? []) as ContentRow[]
  const pendingComments = (pendingCommentsData ?? []) as ContentRow[]

  // ── 3. Archived content ──────────────────────────────────────────────────
  const [{ data: archivedPostsData }, { data: archivedCommentsData }] = await Promise.all([
    (supabase as any)
      .from('posts').select('id, title, body, created_at, dept_id')
      .eq('university_id', uniId).eq('status', 'archived')
      .order('created_at', { ascending: false }),
    supabase
      .from('comments').select('id, body, created_at, post_id')
      .eq('status', 'archived')
      .in('post_id', postIds.length ? postIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false }),
  ])
  const archivedPosts    = (archivedPostsData ?? []) as ContentRow[]
  const archivedComments = (archivedCommentsData ?? []) as ContentRow[]

  const pendingTotal  = pendingPosts.length + pendingComments.length
  const archivedTotal = archivedPosts.length + archivedComments.length

  const REASON_LABELS: Record<string, string> = {
    inappropriate: 'Inappropriate',
    inaccurate:    'Inaccurate',
    spam:          'Spam',
    harmful:       'Harmful',
    other:         'Other',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Moderation queue</h1>
          </div>
        </div>

        {/* ── Flagged content ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Reported content</h2>
            {flagGroups.length > 0 && (
              <span className="badge-red">{flagGroups.length} item{flagGroups.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {!flagGroups.length ? (
            <div className="card p-10 text-center">
              <Shield className="w-8 h-8 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">No pending reports. All clear.</p>
            </div>
          ) : (
            flagGroups.map(group => (
              <div key={group.contentId} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge-amber capitalize">{group.contentType.replace('_', ' ')}</span>
                      {group.reportCount > 1 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" />
                          {group.reportCount} reports
                        </span>
                      )}
                      {group.reasons.map(r => (
                        <span key={r} className="badge-gray">{REASON_LABELS[r] ?? r}</span>
                      ))}
                    </div>

                    {/* Content preview */}
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{group.preview.headline}</p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {group.preview.body}
                      </p>
                    </div>

                    {/* Latest note */}
                    {group.latestNote && (
                      <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <span className="font-medium text-amber-800">Reporter note:</span> {group.latestNote}
                      </p>
                    )}

                    <p className="text-xs text-gray-400">
                      First reported {new Date(group.latestAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <FlagActions contentType={group.contentType} contentId={group.contentId} />
                </div>
              </div>
            ))
          )}
        </section>

        {/* ── Pending deletion requests ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">Deletion requests</h2>
            {pendingTotal > 0 && <span className="badge-amber">{pendingTotal}</span>}
          </div>

          {!pendingTotal ? (
            <div className="card p-10 text-center">
              <Trash2 className="w-8 h-8 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">No pending deletion requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map(post => (
                <div key={post.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-amber">Post</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{post.title ?? 'Untitled'}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{post.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Requested {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <PendingDeleteActions contentType="post" contentId={post.id} />
                  </div>
                </div>
              ))}
              {pendingComments.map(comment => (
                <div key={comment.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <span className="badge-amber">Comment</span>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{comment.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Requested {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Archive className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Archived</h2>
            {archivedTotal > 0 && <span className="badge-gray">{archivedTotal}</span>}
          </div>

          {!archivedTotal ? (
            <div className="card p-10 text-center">
              <Archive className="w-8 h-8 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">No archived content.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedPosts.map(post => (
                <div key={post.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-gray">Post</span>
                        <p className="text-sm font-medium text-gray-700 truncate">{post.title ?? 'Untitled'}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{post.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Archived {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <ArchiveActions contentType="post" contentId={post.id} />
                  </div>
                </div>
              ))}
              {archivedComments.map(comment => (
                <div key={comment.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <span className="badge-gray">Comment</span>
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{comment.body}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Archived {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
