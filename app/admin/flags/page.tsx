import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { FlagActions } from './FlagActions'
import { Shield, AlertTriangle } from 'lucide-react'
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

export default async function AdminFlagsPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
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
      </main>
    </div>
  )
}
