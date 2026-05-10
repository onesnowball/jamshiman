import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Flag, Users, UserCog, Shield, BookOpen } from 'lucide-react'
import { getAdminViewer } from '@/lib/server-auth'

export default async function AdminPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const [{ count: flagCount }, { count: userCount }, { count: advisorCount }, { count: courseCount }] = await Promise.all([
    supabase.from('flags').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('advisors').select('*', { count: 'exact', head: true }).eq('active', true),
    supabaseAny.from('courses').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Pending flags',   value: flagCount ?? 0,   icon: Flag,     href: '/admin/flags',    urgent: (flagCount ?? 0) > 0 },
    { label: 'Signed-in users', value: userCount ?? 0,   icon: Users,    href: '/admin/access',   urgent: false },
    { label: 'Active advisors', value: advisorCount ?? 0, icon: UserCog, href: '/admin/advisors', urgent: false },
    { label: 'Courses',         value: courseCount ?? 0,  icon: BookOpen, href: '/admin/courses',  urgent: (courseCount ?? 0) === 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900">Admin dashboard</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, href, urgent }) => (
            <Link key={label} href={href} className="card p-5 hover:border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="section-label mb-1">{label}</p>
                  <p className={`text-3xl font-semibold ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
                    {value}
                  </p>
                </div>
                <Icon className={`w-5 h-5 mt-1 ${urgent ? 'text-red-400' : 'text-gray-300'}`} />
              </div>
            </Link>
          ))}
        </div>

        <div className="card divide-y divide-gray-50">
          {[
            { href: '/admin/flags',    icon: Flag,     label: 'Review flagged content',  desc: 'Approve or remove reported posts and reviews' },
            { href: '/admin/courses',  icon: BookOpen, label: 'Manage courses',           desc: 'Add, edit, and seed the course catalog' },
            { href: '/admin/advisors', icon: UserCog,  label: 'Manage advisors',          desc: 'Create, edit, and deactivate advisor listings' },
            { href: '/admin/access',   icon: Users,    label: 'Manage admin access',      desc: 'Promote signed-in users into the launch admin team' },
          ].map(({ href, icon: Icon, label, desc }) => (
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
