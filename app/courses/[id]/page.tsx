import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, GraduationCap, MessageSquare, Plus } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { FlagButton } from '@/components/FlagButton'
import { CourseDiscussionTab } from '@/components/course/CourseDiscussionTab'
import { CourseReviewForm } from '@/components/forms/CourseReviewForm'
import { StarRating } from '@/components/ui/StarRating'
import { createClient } from '@/lib/supabase/server'
import type { Course, CourseRatings, CourseReview } from '@/types/database'

const RATING_LABELS: Record<keyof CourseRatings, string> = {
  difficulty: 'Difficulty',
  usefulness: 'Usefulness',
  workload: 'Workload',
  professor: 'Instruction',
}

type CoursePageCourse = Course & {
  departments: { name: string | null } | null
}

type CoursePageReview = Pick<
  CourseReview,
  'id' | 'semester' | 'degree_type' | 'ratings' | 'anonymized_text' | 'created_at'
>

function averageRatings(reviews: CoursePageReview[]) {
  const totals = {
    difficulty: 0,
    usefulness: 0,
    workload: 0,
    professor: 0,
  }

  reviews.forEach(review => {
    totals.difficulty += review.ratings.difficulty
    totals.usefulness += review.ratings.usefulness
    totals.workload += review.ratings.workload
    totals.professor += review.ratings.professor
  })

  const count = reviews.length || 1
  return {
    difficulty: totals.difficulty / count,
    usefulness: totals.usefulness / count,
    workload: totals.workload / count,
    professor: totals.professor / count,
    overall: (totals.difficulty + totals.usefulness + totals.workload + totals.professor) / (count * 4),
  }
}

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { tab?: string }
}) {
  const supabase = createClient()
  const activeTab = searchParams?.tab === 'discussion' ? 'discussion' : 'reviews'

  const { data: courseData } = await supabase
    .from('courses')
    .select('*, departments(name)')
    .eq('id', params.id)
    .single()
  const course = courseData as CoursePageCourse | null

  if (!course) notFound()

  const { data: reviewsData } = await supabase
    .from('course_reviews')
    .select('id, semester, degree_type, ratings, anonymized_text, created_at')
    .eq('course_id', params.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  const reviews = (reviewsData ?? []) as CoursePageReview[]

  const { count: discussionCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', params.id)
    .eq('board_type', 'course')
    .eq('status', 'active')

  const showReviews = reviews.length >= 3
  const averages = showReviews ? averageRatings(reviews) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter space-y-6">
        <div>
          <p className="text-sm font-semibold text-brand-700">{course.code}</p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{course.name}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {course.departments?.name ?? 'Department pending'}
            {course.credits ? ` · ${course.credits} credits` : ''}
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          <Link
            href={`/courses/${course.id}`}
            className={[
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'reviews'
                ? 'bg-brand-600 text-white'
                : 'text-gray-500 hover:text-gray-900',
            ].join(' ')}
          >
            Reviews
            <span className="ml-2 opacity-80">{reviews.length}</span>
          </Link>
          <Link
            href={`/courses/${course.id}?tab=discussion`}
            className={[
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'discussion'
                ? 'bg-brand-600 text-white'
                : 'text-gray-500 hover:text-gray-900',
            ].join(' ')}
          >
            Discussion
            <span className="ml-2 opacity-80">{discussionCount ?? 0}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-semibold flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{course.code}</p>
                  <h2 className="font-semibold text-gray-900 leading-tight">{course.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.departments?.name ?? 'Department pending'}
                    {course.credits ? ` · ${course.credits} credits` : ''}
                  </p>
                </div>
              </div>

              {averages && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall snapshot</span>
                    <span className="badge-blue">{reviews.length} reviews</span>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {(Object.keys(RATING_LABELS) as (keyof CourseRatings)[]).map(key => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{RATING_LABELS[key]}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${((averages[key] as number) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-6 text-right">
                            {(averages[key] as number).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'reviews' ? (
              <div className="card p-5">
                <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand-600" />
                  Write a course review
                </h2>
                <CourseReviewForm
                  course={{ ...course, dept_name: course.departments?.name ?? undefined }}
                />
              </div>
            ) : (
              <div className="card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" />
                  <h2 className="font-medium text-gray-900">What discussion is for</h2>
                </div>
                <p className="text-sm text-gray-500">
                  Use the discussion tab for live, class-specific questions: “How rough was the midterm?”, “Anyone want a study group?”, or “What actually matters for this project?”
                </p>
                <p className="text-xs text-gray-400">
                  Reviews are better for retrospective takeaways. Discussion is for what students need during the semester.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'reviews' ? (
              <>
                <h2 className="font-medium text-gray-900">
                  {showReviews ? `${reviews.length} reviews` : 'Reviews'}
                </h2>

                {!showReviews && (
                  <div className="card p-8 text-center text-gray-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Reviews unlock after 3 submissions
                    </p>
                    <p className="text-xs">
                      Course reviews stay hidden until there are at least 3, which keeps small-class feedback safer to share.
                      {reviews.length ? ` ${reviews.length} review${reviews.length === 1 ? '' : 's'} so far.` : ' Be the first.'}
                    </p>
                  </div>
                )}

                {showReviews && reviews.map(review => (
                  <div key={review.id} className="card p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className={review.degree_type === 'phd' ? 'badge-blue' : 'badge-green'}>
                          {review.degree_type.toUpperCase()}
                        </span>
                        <span className="badge-gray">{review.semester}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(Object.keys(RATING_LABELS) as (keyof CourseRatings)[]).map(key => (
                        <div key={key} className="text-center">
                          <div className="text-xs text-gray-400 mb-1">{RATING_LABELS[key]}</div>
                          <StarRating value={review.ratings[key]} readonly size="sm" />
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {review.anonymized_text}
                    </p>

                    <FlagButton contentType="course_review" contentId={review.id} />
                  </div>
                ))}
              </>
            ) : (
              <CourseDiscussionTab courseId={course.id} courseCode={course.code} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
