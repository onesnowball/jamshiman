import { Navbar } from '@/components/Navbar'
import { AdvisorSearch } from '@/components/advisors/AdvisorSearch'
import { createClient } from '@/lib/supabase/server'

export default async function AdvisorsPage() {
  const supabase = createClient()

  const { data: advisorsData } = await supabase
    .from('advisors')
    .select('*, departments(name), advisor_aggregates(review_count, avg_overall)')
    .eq('active', true)
    .order('name')
    .limit(200)

  const advisors = (advisorsData ?? []) as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-2">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Advisors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Anonymous reviews from verified UMich students — lab members, collaborators, and committee students.
          </p>
        </div>
        <AdvisorSearch advisors={advisors} />
      </main>
    </div>
  )
}
