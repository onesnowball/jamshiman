import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Layers, GraduationCap, BookOpen, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getUniversityBySlug } from '@/lib/school'

export const dynamic = 'force-dynamic'

export default async function DepartmentsPage({ params }: { params: { school: string } }) {
  const university = await getUniversityBySlug(params.school)
  if (!university) notFound()

  const supabase = createAdminClient()

  const [{ data: deptData }, { data: advisorData }, { data: courseData }] = await Promise.all([
    supabase
      .from('departments')
      .select('id, name, slug')
      .eq('university_id', university.id)
      .eq('is_board_category', false)
      .eq('active', true)
      .order('name'),
    supabase
      .from('advisors')
      .select('id, dept_id')
      .eq('university_id', university.id)
      .eq('active', true),
    (supabase as any)
      .from('courses')
      .select('id, dept_id')
      .eq('university_id', university.id),
  ])

  const departments = (deptData ?? []) as { id: string; name: string; slug: string }[]

  const advisorCountMap = new Map<string, number>()
  for (const a of (advisorData ?? []) as { dept_id: string }[]) {
    advisorCountMap.set(a.dept_id, (advisorCountMap.get(a.dept_id) ?? 0) + 1)
  }

  const courseCountMap = new Map<string, number>()
  for (const c of (courseData ?? []) as { dept_id: string }[]) {
    courseCountMap.set(c.dept_id, (courseCountMap.get(c.dept_id) ?? 0) + 1)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-brand-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        </div>
        <p className="text-sm text-gray-500">
          Advisor reviews, course advice, and anonymous discussion — by department.
        </p>
      </div>

      {!departments.length ? (
        <div className="card p-10 text-center text-gray-400">
          <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-700">No departments yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {departments.map(dept => {
            const advisorCount = advisorCountMap.get(dept.id) ?? 0
            const courseCount = courseCountMap.get(dept.id) ?? 0
            return (
              <Link
                key={dept.id}
                href={`/${params.school}/departments/${dept.slug}`}
                className="card p-4 flex items-center justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">
                    {dept.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {advisorCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <GraduationCap className="w-3 h-3" />
                        {advisorCount} advisor{advisorCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {courseCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <BookOpen className="w-3 h-3" />
                        {courseCount} course{courseCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
