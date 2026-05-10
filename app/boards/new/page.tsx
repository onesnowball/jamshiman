import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { NewPostForm } from '@/components/boards/NewPostForm'
import { createClient } from '@/lib/supabase/server'
import { getOptionalViewer } from '@/lib/server-auth'
import type { Department } from '@/types/database'

export default async function NewPostPage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = createClient()
  const { data } = await supabase.from('departments').select('*').eq('active', true).order('name')
  const departments = (data ?? []) as Department[]

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
