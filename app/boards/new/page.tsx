import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { NewPostForm } from '@/components/boards/NewPostForm'
import { createAdminClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import type { Department } from '@/types/database'

export default async function NewPostPage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = createAdminClient()
  const { data } = await supabase.from('departments').select('*').eq('active', true).order('name')
  const raw = (data ?? []) as Department[]

  // General boards first, then academic departments
  const GENERAL_SLUGS = ['general', 'career', 'housing', 'research', 'wellbeing', 'marketplace']
  const departments = [
    ...raw.filter(d => GENERAL_SLUGS.includes(d.slug)).sort((a, b) => GENERAL_SLUGS.indexOf(a.slug) - GENERAL_SLUGS.indexOf(b.slug)),
    ...raw.filter(d => !GENERAL_SLUGS.includes(d.slug)),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 page-enter">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">New post</h1>
          <p className="text-sm text-gray-500 mt-1">Your post is anonymous by default.</p>
        </div>
        <NewPostForm departments={departments} />
      </main>
    </div>
  )
}
