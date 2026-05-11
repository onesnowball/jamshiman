import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Flag, Users, UserCog, Shield, BookOpen, Layers, AlertCircle, ShieldOff } from 'lucide-react'
import { getAdminViewer } from '@/lib/server-auth'

export default async function AdminPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')
  const supabase = createAdminClient()
  const supabaseAny = supabase as any

  const isGlobalAdmin = viewer.role === 'admin'

  // ── Resolve which university this admin is currently managing ─────────────
  // School context is the primary divider — stats are ALWAYS scoped to one school.
  let targetUniversityId: string | null = null
  let targetUniversityName: string | null = null

  if (isGlobalAdmin) {
    const lastSchool = cookies().get('last_school')?.value
    if (lastSchool) {
      const { data } = await supabase
        .from('universities')
        .select('id, name')
        .eq('domain', `${lastSchool}.edu`)
        .single()
      if (data) {
        targetUniversityId = (data as { id: string; name: string }).id
        targetUniversityName = (data as { id: string; name: string }).name
      }
    }
  } else {
    targetUniversityId = viewer.campusAdminUniversityIds[0] ?? null
    if (targetUniversityId) {
      const { data } = await supabase
        .from('universities')
        .select('name')
        .eq('id', targetUniversityId)
        .single()
      targetUniversityName = (data as { name: string } | null)?.name ?? null
    }
  }

  // ── Stats — all scoped to the target university ───────────────────────────
  let flagCount = 0, userCount = 0, advisorCount = 0, courseCount = 0, suspReqCount = 0

  if (targetUniversityId) {
    const uid = targetUniversityId

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
    { label: 'Pending flags',        value: flagCount,    icon: Flag,      href: '/admin/flags',   urgent: flagCount > 0 },
    { label: 'Suspension requests',  value: suspReqCount, icon: ShieldOff, href: '/admin/users',   urgent: suspReqCount > 0 },
    { label: 'Signed-in users',      value: userCount,    icon: Users,     href: '/admin/users',   urgent: false },
    { label: 'Active advisors',      value: advisorCount, icon: UserCog,   href: '/admin/advisors',urgent: false },
  ]

  const navLinks = [
    { href: '/admin/flags',       icon: Flag,     label: 'Review flagged content', desc: 'Approve or remove reported posts and reviews' },
    { href: '/admin/departments', icon: Layers,   label: 'Manage departments',      desc: 'Create board categories and academic departments' },
    { href: '/admin/courses',     icon: BookOpen, label: 'Manage courses',          desc: 'Add, edit, and seed the course catalog' },
    { href: '/admin/advisors',    icon: UserCog,  label: 'Manage advisors',         desc: 'Create, edit, and deactivate advisor listings' },
    ...(isGlobalAdmin
      ? [{ href: '/admin/access', icon: Users, label: 'Manage admin access', desc: 'Promote users and assign campus admins' }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── School header — primary context ── */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Admin dashboard</p>
            {targetUniversityName ? (
              <h1 className="text-xl font-semibold text-gray-900">{targetUniversityName}</h1>
            ) : (
              <h1 className="text-xl font-semibold text-gray-400 italic">No school selected</h1>
            )}
          </div>
          {!isGlobalAdmin && <span className="badge-blue ml-auto">Campus admin</span>}
        </div>

        {/* ── Warning if no school context ── */}
        {!targetUniversityId && (
          <div className="card p-5 mb-6 flex items-start gap-3 border-amber-200 bg-amber-50">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">No school selected</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Navigate to a school first (e.g. /umich/boards) then return here to see that school's stats.
              </p>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, href, urgent }) => {
            const card = (
              <div className="flex items-start justify-between">
                <div>
                  <p className="section-label mb-1">{label}</p>
                  <p className={`text-3xl font-semibold ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
                    {targetUniversityId ? value : '—'}
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
    </div>
  )
}
