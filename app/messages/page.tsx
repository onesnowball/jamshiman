import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, Pencil } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { createAdminClient } from '@/lib/supabase/server'
import { isOnboarded } from '@/lib/onboarding'
import { timeAgoCompact as timeAgo } from '@/lib/format/relative-time'

type Message = {
  id: string; sender_id: string; recipient_id: string
  body: string; read_at: string | null; created_at: string
}

export default async function MessagesPage() {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')
  if (!isOnboarded(viewer as any)) redirect('/profile/onboarding')

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

  const otherIds = Array.from(convoMap.keys())
  const emailMap = await getAuthEmailMap(otherIds)
  const conversations = otherIds.map(id => ({
    userId: id,
    handle: toPublicHandle(emailMap.get(id)),
    ...convoMap.get(id)!,
  }))

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 page-enter space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Messages
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Direct messages with fellow students</p>
          </div>
          <Link
            href="/messages/compose"
            className="flex items-center gap-1.5 btn-secondary text-xs py-1.5 px-3"
          >
            <Pencil className="w-3.5 h-3.5" />
            Compose
          </Link>
        </div>

        {!conversations.length ? (
          <div className="card p-12 text-center">
            <Mail className="w-8 h-8 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-700">No messages yet.</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Start a conversation with a fellow student.
            </p>
            <Link href="/messages/compose" className="btn-primary text-xs py-1.5">
              <Pencil className="w-3.5 h-3.5" />
              New message
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50 overflow-hidden">
            {conversations.map(c => (
              <Link
                key={c.userId}
                href={`/messages/${c.userId}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold">
                    {c.handle.slice(0, 2).toUpperCase()}
                  </div>
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {c.unread > 9 ? '9+' : c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${c.unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                      {c.handle}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {timeAgo(c.lastMessage.created_at)}
                    </p>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${c.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                    {c.lastMessage.sender_id === viewer.id ? 'You: ' : ''}{c.lastMessage.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
