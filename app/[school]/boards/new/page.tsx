import { redirect } from 'next/navigation'
import { NewPostForm } from '@/components/boards/NewPostForm'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import { getUniversityBySlug, domainToSlug } from '@/lib/school'
import type { Department } from '@/types/database'

export default async function NewPostPage({ params }: { params: { school: string } }) {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect(`/auth/login?school=${params.school}.edu`)

  const university = await getUniversityBySlug(params.school)
  if (!university) redirect('/')

  // Prevent cross-school posting — bounce the user to their own school's new post page
  if (viewer.university_id !== university.id) {
    const supabaseAdmin = createAdminClient()
    const { data: viewerUni } = await supabaseAdmin
      .from('universities')
      .select('domain')
      .eq('id', viewer.university_id)
      .single()
    const viewerSlug = viewerUni ? domainToSlug((viewerUni as { domain: string }).domain) : params.school
    redirect(`/${viewerSlug}/boards/new`)
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('departments')
    .select('*')
    .eq('active', true)
    .eq('university_id', university.id)
    .order('name')

  const raw = (data ?? []) as Department[]
  // Board categories first (General at front), then academic depts
  const boardDepts = raw.filter(d => d.is_board_category)
  const generalIdx = boardDepts.findIndex(d => d.slug === 'general')
  if (generalIdx > 0) boardDepts.unshift(...boardDepts.splice(generalIdx, 1))
  const departments = [...boardDepts, ...raw.filter(d => !d.is_board_category)]

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New post</h1>
        <p className="text-sm text-gray-500 mt-1">Your post is anonymous by default.</p>
      </div>
      <NewPostForm departments={departments} />
    </main>
  )
}
