import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'

export const dynamic = 'force-dynamic'
import { AdvisorReviewForm } from '@/components/forms/AdvisorReviewForm'
import { RatingDisplay, StarRating } from '@/components/ui/StarRating'
import { FlaskConical, GraduationCap, Plus, ShieldCheck } from 'lucide-react'
import { FlagButton } from '@/components/FlagButton'
import type { Advisor, AdvisorRatings, AdvisorReview, Database } from '@/types/database'

const RATING_LABELS: Record<string, string> = {
  mentorship:     'Mentorship',
  funding:        'Funding',
  worklife:       'Work-life',
  communication:  'Communication',
  career:         'Career support',
  lab_atmosphere: 'Lab atmosphere',
}

const AGGREGATE_KEYS: { key: string; label: string }[] = [
  { key: 'avg_mentorship',    label: 'Mentorship' },
  { key: 'avg_funding',       label: 'Funding' },
  { key: 'avg_worklife',      label: 'Work-life' },
  { key: 'avg_communication', label: 'Communication' },
  { key: 'avg_career',        label: 'Career support' },
]

type AdvisorPageAdvisor = Advisor & { departments: { name: string } | null }
type AdvisorAggregate = Database['public']['Views']['advisor_aggregates']['Row']
type AdvisorPageReview = Pick<AdvisorReview, 'id' | 'degree_type' | 'ratings' | 'anonymized_text' | 'created_at'>

function timeLabel(dateStr: string): string {
  const weeks = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 7)
  if (weeks < 2)  return 'recently'
  if (weeks < 6)  return 'this month'
  if (weeks < 26) return 'this semester'
  if (weeks < 78) return 'last year'
  return 'a few years ago'
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  true:  'Lab member',
  false: 'Non-lab student',
}

export default async function AdvisorPage({ params }: { params: { school: string; id: string } }) {
  const supabase = createAdminClient()
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const [{ data: advisorData }, { data: statsData }, { data: reviewsData }] = await Promise.all([
    supabase.from('advisors').select('*, departments(name)').eq('id', params.id).eq('university_id', university.id).single(),
    supabase.from('advisor_aggregates').select('*').eq('advisor_id', params.id).single(),
    supabase.from('advisor_reviews')
      .select('id, degree_type, ratings, anonymized_text, created_at, is_lab_member')
      .eq('advisor_id', params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  const advisor = advisorData as AdvisorPageAdvisor | null
  if (!advisor) notFound()

  const stats = statsData as AdvisorAggregate | null
  const reviews = (reviewsData ?? []) as (AdvisorPageReview & { is_lab_member: boolean | null })[]

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
                  {AGGREGATE_KEYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((stats[key as keyof AdvisorAggregate] as number) / 5) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-6 text-right">
                          {(stats[key as keyof AdvisorAggregate] as number).toFixed(1)}
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
              <p className="text-sm font-medium text-gray-700 mb-1">Be the first to review this advisor.</p>
              <p className="text-xs">Help future students understand the lab environment.</p>
            </div>
          )}

          {reviews.map(review => {
            const ratingKeys = Object.keys(RATING_LABELS).filter(k => (review.ratings as any)[k] > 0)
            return (
              <div key={review.id} className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {review.is_lab_member != null && (
                      <span className={review.is_lab_member ? 'badge-blue' : 'badge-green'}>
                        {RELATIONSHIP_LABEL[String(review.is_lab_member)]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{timeLabel(review.created_at)}</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ratingKeys.map(key => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] text-gray-400 mb-1">{RATING_LABELS[key].split(' ')[0]}</div>
                      <StarRating value={(review.ratings as any)[key] ?? 0} readonly size="sm" />
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">{review.anonymized_text}</p>
                <div className="flex items-center justify-between pt-1">
                  <FlagButton contentType="review" contentId={review.id} />
                </div>
              </div>
            )
          })}

          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified students only · Anonymous by default · Moderated for safety.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
