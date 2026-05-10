import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { createAdminClient } from '@/lib/supabase/server'

type Message = {
  id: string; sender_id: string; recipient_id: string
  body: string; read_at: string | null; created_at: string
}

export default async function MessagesPage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const db = createAdminClient() as any
  const { data } = await db
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${viewer.id},recipient_id.eq.${viewer.id}`)
    .order('created_at', { ascending: false })
    .limit(200)

  const messages = (data ?? []) as Message[]
  const convoMap = new Map<string, { lastMessage: Message; unread: number }>()
  for (const msg of messages) {
    const otherId = msg.sender_id === viewer.id ? msg.recipient_id : msg.sender_id
    if (!convoMap.has(otherId)) convoMap.set(otherId, { lastMessage: msg, unread: 0 })
    if (msg.recipient_id === viewer.id && !msg.read_at) convoMap.get(otherId)!.unread++
  }

  const otherIds = [...convoMap.keys()]
  const emailMap = await getAuthEmailMap(otherIds)
  const conversations = otherIds.map(id => ({
    userId: id,
    handle: toPublicHandle(emailMap.get(id)),
    ...convoMap.get(id)!,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin={viewer.role === 'admin'} />
      <main className="max-w-2xl mx-auto px-4 py-6 page-enter space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Messages</h1>

        {!conversations.length ? (
          <div className="card p-12 text-center text-gray-400">
            <Mail className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-700">No messages yet.</p>
            <p className="text-xs mt-1">Message non-anonymous post authors directly from their threads.</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50 overflow-hidden">
            {conversations.map(c => (
              <Link
                key={c.userId}
                href={`/messages/${c.userId}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold flex-shrink-0">
                  {c.handle.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{c.handle}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(c.lastMessage.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{c.lastMessage.body}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                    {c.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
