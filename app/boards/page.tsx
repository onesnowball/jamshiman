import Link from 'next/link'
import { BookOpen, MessageSquare, MessagesSquare } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import type { Course, Department, Post } from '@/types/database'

type ActiveCourseThread = Pick<Post, 'id' | 'title' | 'created_at' | 'course_id'>

export default async function BoardsPage() {
  const supabase = createClient()

  const { data: departmentsData } = await supabase
    .from('departments')
    .select('*')
    .eq('active', true)
    .order('name')
  const departments = (departmentsData ?? []) as Department[]

  const boards = await Promise.all(departments.map(async department => {
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('dept_id', department.id)
      .eq('board_type', 'department')
      .eq('status', 'active')

    return {
      ...department,
      postCount: count ?? 0,
    }
  }))

  const { data: activeThreadsData } = await supabase
    .from('posts')
    .select('id, title, created_at, course_id')
    .eq('board_type', 'course')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)
  const activeThreads = (activeThreadsData ?? []) as ActiveCourseThread[]

  const courseIds = activeThreads
    .map(thread => thread.course_id)
    .filter((courseId): courseId is string => Boolean(courseId))

  const { data: coursesData } = courseIds.length
    ? await supabase
        .from('courses')
        .select('id, code, name')
        .in('id', courseIds)
    : { data: [] as Pick<Course, 'id' | 'code' | 'name'>[] }
  const courseMap = new Map((coursesData ?? []).map(course => [course.id, course]))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter space-y-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Department boards</h1>
          <p className="text-gray-500 text-sm">
            Lightweight department spaces for questions, candid context, and “I wish someone had told me this” posts.
          </p>
        </div>

        {!boards.length ? (
          <div className="card p-10 text-center text-gray-400">
            <MessagesSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No departments are active yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boards.map(board => (
              <Link
                key={board.id}
                href={`/boards/${board.slug}`}
                className="card p-5 hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-medium text-gray-900">{board.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Anonymous-first discussion for students in this department.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="badge-blue">{board.postCount} thread{board.postCount === 1 ? '' : 's'}</div>
                    <MessageSquare className="w-5 h-5 text-brand-500 mt-3 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeThreads.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Active course discussions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Fresh class threads across UMich, so students can discover where there’s already momentum.
              </p>
            </div>

            <div className="space-y-3">
              {activeThreads.map(thread => {
                const course = thread.course_id ? courseMap.get(thread.course_id) : null
                if (!course || !thread.course_id) return null

                return (
                  <Link
                    key={thread.id}
                    href={`/courses/${thread.course_id}/discussion/${thread.id}`}
                    className="card p-5 flex items-start justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs text-brand-700 font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.code}
                      </div>
                      <h3 className="font-medium text-gray-900 mt-2">{thread.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{course.name}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(thread.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
