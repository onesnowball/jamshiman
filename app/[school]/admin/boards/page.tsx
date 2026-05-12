import { redirect } from 'next/navigation'
import { Hash } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'
import { BoardTopicManager } from '@/components/admin/BoardTopicManager'
import type { Department } from '@/types/database'

export default async function AdminBoardsPage({ params }: { params: { school: string } }) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const university = await requireAdminUniversity(viewer, params.school)

  const supabase = createAdminClient()

  const { data: topicData } = await (supabase as any)
    .from('departments')
    .select('*, universities(name)')
    .eq('university_id', university.id)
    .eq('is_board_category', true)
    .order('name')

  const topics = (topicData ?? []) as (Department & { universities: { name: string } | null })[]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{university.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">Board Topics</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Topic filters shown on the community boards page.
            </p>
          </div>
        </div>

        <BoardTopicManager
          departments={topics}
          universities={[university]}
        />
      </main>
    </div>
  )
}
