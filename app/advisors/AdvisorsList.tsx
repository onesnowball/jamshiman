import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RatingDisplay } from '@/components/ui/StarRating'
import { FlaskConical, Users } from 'lucide-react'

export async function AdvisorsList({ q, dept }: { q?: string; dept?: string }) {
  const supabase = createClient()

  let query = supabase
    .from('advisors')
    .select(`
      *,
      departments(name),
      advisor_aggregates(review_count, avg_overall, avg_mentorship, avg_funding, avg_worklife, avg_communication, avg_career)
    `)
    .eq('active', true)
    .order('name')

  if (q) query = query.ilike('name', `%${q}%`)
  if (dept) query = query.eq('dept_id', dept)

  const { data: advisors, error } = await query.limit(50)

  if (error) return <p className="text-red-500 text-sm">Error loading advisors.</p>
  if (!advisors?.length) return (
    <div className="text-center py-16 text-gray-400">
      <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm">No advisors found{q ? ` for "${q}"` : ''}.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {advisors.map((advisor: any) => {
        const stats = advisor.advisor_aggregates
        const hasReviews = stats?.review_count >= 3

        return (
          <Link
            key={advisor.id}
            href={`/advisors/${advisor.id}`}
            className="card p-5 flex items-start gap-4 hover:border-brand-200 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-sm flex-shrink-0 group-hover:bg-brand-100 transition-colors">
              {advisor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">
                    {advisor.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {advisor.departments?.name || 'Mechanical Engineering'}
                    {advisor.title && ` · ${advisor.title}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {hasReviews ? (
                    <RatingDisplay
                      value={parseFloat(stats.avg_overall)}
                      count={stats.review_count}
                    />
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      {stats?.review_count ?? 0} review{stats?.review_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {advisor.lab_name && (
                <div className="flex items-center gap-1 mt-1.5">
                  <FlaskConical className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{advisor.lab_name}</span>
                </div>
              )}

              {advisor.research_areas?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {advisor.research_areas.slice(0, 4).map((area: string) => (
                    <span key={area} className="badge-gray text-[10px]">{area}</span>
                  ))}
                  {advisor.research_areas.length > 4 && (
                    <span className="badge-gray text-[10px]">+{advisor.research_areas.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
