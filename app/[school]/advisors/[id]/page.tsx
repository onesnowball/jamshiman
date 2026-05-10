import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { AdvisorReviewForm } from '@/components/forms/AdvisorReviewForm'
import { RatingDisplay, StarRating } from '@/components/ui/StarRating'
import { FlaskConical, Clock, GraduationCap, Plus } from 'lucide-react'
import { FlagButton } from '@/components/FlagButton'
import type { Advisor, AdvisorRatings, AdvisorReview, Database } from '@/types/database'

const RATING_LABELS: Record<keyof AdvisorRatings, string> = {
  mentorship: 'Mentorship',
  funding: 'Funding',
  worklife: 'Work-life',
  communication: 'Communication',
  career: 'Career support',
}

type AdvisorPageAdvisor = Advisor & { departments: { name: string } | null }
type AdvisorAggregate = Database['public']['Views']['advisor_aggregates']['Row']
type AdvisorPageReview = Pick<AdvisorReview, 'id' | 'degree_type' | 'ratings' | 'anonymized_text' | 'years_in_lab' | 'is_current' | 'created_at'>

export default async function AdvisorPage({ params }: { params: { school: string; id: string } }) {
  const supabase = createAdminClient()

  const [{ data: advisorData }, { data: statsData }, { data: reviewsData }] = await Promise.all([
    supabase.from('advisors').select('*, departments(name)').eq('id', params.id).single(),
    supabase.from('advisor_aggregates').select('*').eq('advisor_id', params.id).single(),
    supabase.from('advisor_reviews')
      .select('id, degree_type, ratings, anonymized_text, years_in_lab, is_current, created_at')
      .eq('advisor_id', params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  const advisor = advisorData as AdvisorPageAdvisor | null
  if (!advisor) notFound()

  const stats = statsData as AdvisorAggregate | null
  const reviews = (reviewsData ?? []) as AdvisorPageReview[]

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold flex-shrink-0">
                {advisor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 leading-tight">{advisor.name}</h1>
                {advisor.title && <p className="text-sm text-gray-500">{advisor.title}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{advisor.departments?.name}</p>
              </div>
            </div>

            {advisor.lab_name && (
              <div className="flex items-center gap-1.5 mb-3">
                <FlaskConical className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-600">{advisor.lab_name}</span>
              </div>
            )}

            {advisor.research_areas?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {advisor.research_areas.map((area: string) => (
                  <span key={area} className="badge-blue text-[11px]">{area}</span>
                ))}
              </div>
            )}

            {stats && reviews.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <RatingDisplay value={stats.avg_overall} count={stats.review_count} />
                <div className="space-y-1.5 mt-3">
                  {(Object.keys(RATING_LABELS) as (keyof AdvisorRatings)[]).map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{RATING_LABELS[key]}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((stats[`avg_${key}`] as number) / 5) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-6 text-right">
                          {(stats[`avg_${key}`] as number).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" /> Write a review
            </h2>
            <AdvisorReviewForm advisor={{ ...advisor, dept_name: advisor.departments?.name }} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-medium text-gray-900">
            {reviews.length > 0 ? `${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'Reviews'}
          </h2>

          {!reviews.length && (
            <div className="card p-8 text-center text-gray-400">
              <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-gray-600 mb-1">No reviews yet</p>
              <p className="text-xs">Be the first to share your experience with this advisor.</p>
            </div>
          )}

          {reviews.map(review => (
            <div key={review.id} className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={review.degree_type === 'phd' ? 'badge-blue' : 'badge-green'}>
                    {review.degree_type.toUpperCase()}
                  </span>
                  {review.is_current && <span className="badge-gray text-[10px]">Current student</span>}
                  {review.years_in_lab && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{review.years_in_lab} yr{review.years_in_lab > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(RATING_LABELS) as (keyof AdvisorRatings)[]).map(key => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{RATING_LABELS[key].split(' ')[0]}</div>
                    <StarRating value={review.ratings[key]} readonly size="sm" />
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">{review.anonymized_text}</p>
              <div className="pt-1"><FlagButton contentType="review" contentId={review.id} /></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
