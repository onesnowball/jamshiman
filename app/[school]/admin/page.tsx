import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Flag, Users, UserCog, Shield, BookOpen, GraduationCap, Hash, ShieldOff } from 'lucide-react'
import { getAdminViewer } from '@/lib/server-auth'
import { requireAdminUniversity } from '@/lib/admin-context'

export default async function AdminPage({ params }: { params: { school: string } }) {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const isGlobalAdmin = viewer.role === 'admin'
  const university = await requireAdminUniversity(viewer, params.school)

  // ── Stats — all scoped to the target university ───────────────────────────
  let flagCount = 0, userCount = 0, advisorCount = 0, courseCount = 0, suspReqCount = 0

  if (university.id) {
    const uid = university.id

    // Get post IDs for this university to count scoped flags
    const { data: uniPosts } = await supabase.from('posts').select('id').eq('university_id', uid)
    const postIds = (uniPosts ?? []).map((p: { id: string }) => p.id)

    const [flagRes, userRes, advisorRes, courseRes, suspReqRes] = await Promise.all([
      postIds.length
        ? supabase.from('flags').select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .in('content_id', postIds)
        : Promise.resolve({ count: 0 }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('university_id', uid),
      supabase.from('advisors').select('*', { count: 'exact', head: true }).eq('university_id', uid).eq('active', true),
      supabaseAny.from('courses').select('*', { count: 'exact', head: true }).eq('university_id', uid),
      supabaseAny.from('suspension_requests').select('*', { count: 'exact', head: true })
        .eq('university_id', uid).eq('status', 'pending'),
    ])

    flagCount    = flagRes.count ?? 0
    userCount    = userRes.count ?? 0
    advisorCount = advisorRes.count ?? 0
    courseCount  = courseRes.count ?? 0
    suspReqCount = suspReqRes.count ?? 0
  }

  const stats = [
    { label: 'Pending flags',        value: flagCount,    icon: Flag,      href: `/${params.school}/admin/flags`,   urgent: flagCount > 0 },
    { label: 'Suspension requests',  value: suspReqCount, icon: ShieldOff, href: `/${params.school}/admin/users`,   urgent: suspReqCount > 0 },
    { label: 'Signed-in users',      value: userCount,    icon: Users,     href: `/${params.school}/admin/users`,   urgent: false },
    { label: 'Active advisors',      value: advisorCount, icon: UserCog,   href: `/${params.school}/admin/advisors`,urgent: false },
  ]

  const navLinks = [
    { href: `/${params.school}/admin/flags`,       icon: Flag,     label: 'Review flagged content', desc: 'Approve or remove reported posts and reviews' },
    { href: `/${params.school}/admin/departments`, icon: GraduationCap, label: 'Manage departments', desc: 'Academic departments for advisors and courses' },
    { href: `/${params.school}/admin/boards`,      icon: Hash,         label: 'Manage board topics',   desc: 'Community topic filters shown on the boards page' },
    { href: `/${params.school}/admin/courses`,     icon: BookOpen, label: 'Manage courses',          desc: 'Add, edit, and seed the course catalog' },
    { href: `/${params.school}/admin/advisors`,    icon: UserCog,  label: 'Manage advisors',         desc: 'Create, edit, and deactivate advisor listings' },
    ...(isGlobalAdmin
      ? [{ href: `/${params.school}/admin/access`, icon: Users, label: 'Manage admin access', desc: 'Promote users and assign campus admins' }]
      : []),
  ]

  return (
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── School header — primary context ── */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Admin dashboard</p>
            <h1 className="text-xl font-semibold text-gray-900">{university.name}</h1>
          </div>
          {!isGlobalAdmin && <span className="badge-blue ml-auto">Campus admin</span>}
        </div>

        {/* ── Stats ── */}
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
              <div key={label} className="card p-5">{card}</div>
            )
          })}
        </div>

        {/* ── Nav links ── */}
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
  )
}
