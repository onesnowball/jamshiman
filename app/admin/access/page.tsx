import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminViewer } from '@/lib/server-auth'
import { getAuthEmailMap } from '@/lib/admin-users'
import { AccessManager } from '@/components/admin/AccessManager'
import type { User } from '@/types/database'

type AccessRecord = User & { email: string }

export default async function AdminAccessPage() {
  const viewer = await getAdminViewer()
  if (!viewer) redirect('/auth/login')

  const supabase = createAdminClient()
  const { data: usersData } = await supabase
    .from('users')
    .select('*')
    .order('role', { ascending: false })
    .order('created_at', { ascending: false })

  const users = (usersData ?? []) as User[]
  const emailMap = await getAuthEmailMap(users.map(user => user.id))

  const records: AccessRecord[] = users
    .map(user => ({
      ...user,
      email: emailMap.get(user.id) ?? `user-${user.id.slice(0, 8)}@hidden`,
    }))
    .sort((left, right) => {
      if (left.role !== right.role) return left.role === 'admin' ? -1 : 1
      return left.email.localeCompare(right.email)
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
              Promote people who have already signed in, and keep the launch team small and intentional.
            </p>
          </div>
        </div>

        <AccessManager users={records} currentUserId={viewer.id} />
      </main>
    </div>
  )
}
