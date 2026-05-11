import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Flag, Users, UserCog, Shield, BookOpen, Layers } from 'lucide-react'
import { getAdminViewer } from '@/lib/server-auth'

export default async function AdminPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const isGlobalAdmin = viewer.role === 'admin'
  const uniIds = isGlobalAdmin ? null : viewer.campusAdminUniversityIds

  // Scope each stat to the admin's universities when campus admin
  let flagQuery = supabase.from('flags').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  let userQuery = supabase.from('users').select('*', { count: 'exact', head: true })
  let advisorQuery = supabase.from('advisors').select('*', { count: 'exact', head: true }).eq('active', true)
  let courseQuery = supabaseAny.from('courses').select('*', { count: 'exact', head: true })

  if (uniIds) {
    userQuery = (userQuery as any).in('university_id', uniIds)
    advisorQuery = (advisorQuery as any).in('university_id', uniIds)
    courseQuery = courseQuery.in('university_id', uniIds)

    // For flags: scope to content that belongs to this university's posts/comments
    // (simplest proxy: count flags on posts from this university + its comments)
    // We don't have a direct university_id on flags, so we fall back to unscoped flag count
    // for campus admins — still actionable, just not filtered yet.
  }

  const [{ count: flagCount }, { count: userCount }, { count: advisorCount }, { count: courseCount }] = await Promise.all([
    flagQuery,
    userQuery,
    advisorQuery,
    courseQuery,
  ])

  const stats = [
    { label: 'Pending flags',   value: flagCount ?? 0,    icon: Flag,     href: '/admin/flags',    urgent: (flagCount ?? 0) > 0 },
    { label: 'Signed-in users', value: userCount ?? 0,    icon: Users,    href: null,              urgent: false },
    { label: 'Active advisors', value: advisorCount ?? 0, icon: UserCog,  href: '/admin/advisors', urgent: false },
    { label: 'Courses',         value: courseCount ?? 0,  icon: BookOpen, href: '/admin/courses',  urgent: (courseCount ?? 0) === 0 },
  ]

  const navLinks = [
    { href: '/admin/flags',       icon: Flag,     label: 'Review flagged content', desc: 'Approve or remove reported posts and reviews' },
    { href: '/admin/departments', icon: Layers,   label: 'Manage departments',      desc: 'Create board categories and academic departments' },
    { href: '/admin/courses',     icon: BookOpen, label: 'Manage courses',          desc: 'Add, edit, and seed the course catalog' },
    { href: '/admin/advisors',    icon: UserCog,  label: 'Manage advisors',         desc: 'Create, edit, and deactivate advisor listings' },
    // Only global admin can manage who has admin access
    ...(isGlobalAdmin ? [{ href: '/admin/access', icon: Users, label: 'Manage admin access', desc: 'Promote users and assign campus admins' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900">Admin dashboard</h1>
          {!isGlobalAdmin && (
            <span className="badge-blue">Campus admin</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, href, urgent }) => {
            const card = (
              <div className="flex items-start justify-between">
                <div>
                  <p className="section-label mb-1">{label}</p>
                  <p className={`text-3xl font-semibold ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
                    {value}
                  </p>
                </div>
                <Icon className={`w-5 h-5 mt-1 ${urgent ? 'text-red-400' : 'text-gray-300'}`} />
              </div>
            )
            return href ? (
              <Link key={label} href={href} className="card p-5 hover:border-gray-200 hover:shadow-md transition-all">
                {card}
              </Link>
            ) : (
              <div key={label} className="card p-5">
                {card}
              </div>
            )
          })}
        </div>

        <div className="card divide-y divide-gray-50">
          {navLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
