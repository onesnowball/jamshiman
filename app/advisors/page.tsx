import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { AdvisorsList } from './AdvisorsList'
import { Search } from 'lucide-react'

export default function AdvisorsPage({
  searchParams,
}: {
  searchParams: { q?: string; dept?: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Advisor reviews</h1>
          <p className="text-gray-500 text-sm">
            Anonymous, verified reviews from current and former lab members.
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <form>
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search by advisor name or research area..."
                className="input pl-9"
              />
            </form>
          </div>
        </div>

        <Suspense fallback={<AdvisorsListSkeleton />}>
          <AdvisorsList q={searchParams.q} dept={searchParams.dept} />
        </Suspense>
      </main>
    </div>
  )
}

function AdvisorsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
