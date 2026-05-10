import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { getAuthEmailMap } from '@/lib/admin-users'
import { AccessManager } from '@/components/admin/AccessManager'
import type { User } from '@/types/database'

type AccessRecord = User & { email: string; campusAdminUniversityIds: string[] }

export default async function AdminAccessPage() {
  const viewer = await getAdminViewer()
  if (!viewer || viewer.role !== 'admin') redirect('/auth/login')

  const supabase = createAdminClient()
  const db = supabase as any

  const [{ data: usersData }, { data: universitiesData }, { data: campusAdminData }] = await Promise.all([
    supabase.from('users').select('*').order('created_at', { ascending: false }),
    supabase.from('universities').select('id, name, domain').eq('active', true).order('name'),
    db.from('campus_admins').select('user_id, university_id'),
  ])

  const users = (usersData ?? []) as User[]
  const universities = (universitiesData ?? []) as Array<{ id: string; name: string; domain: string }>
  const campusAdmins = (campusAdminData ?? []) as Array<{ user_id: string; university_id: string }>

  const campusMap = new Map<string, string[]>()
  for (const ca of campusAdmins) {
    if (!campusMap.has(ca.user_id)) campusMap.set(ca.user_id, [])
    campusMap.get(ca.user_id)!.push(ca.university_id)
  }

  const emailMap = await getAuthEmailMap(users.map(u => u.id))

  const records: AccessRecord[] = users
    .map(user => ({
      ...user,
      email: emailMap.get(user.id) ?? `user-${user.id.slice(0, 8)}@hidden`,
      campusAdminUniversityIds: campusMap.get(user.id) ?? [],
    }))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
      return a.email.localeCompare(b.email)
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 page-enter space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin access</h1>
            <p className="text-sm text-gray-500 mt-1">
              Promote global admins and assign campus admins per university.
            </p>
          </div>
        </div>

        <AccessManager users={records} universities={universities} currentUserId={viewer.id} />
      </main>
    </div>
  )
}
