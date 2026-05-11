import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { createAdminClient } from '@/lib/supabase/server'
import { MessageCompose } from '@/components/messages/MessageCompose'
import { ChatScrollAnchor } from '@/components/messages/ChatScrollAnchor'

type Message = {
  id: string; sender_id: string; recipient_id: string
  body: string; read_at: string | null; created_at: string
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function MessageThreadPage({
  params,
}: { params: { userId: string } }) {
  const viewer = await getOptionalViewer()
  if (!viewer) redirect('/auth/login')

  const db = createAdminClient() as any
  const { data } = await db
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${viewer.id},recipient_id.eq.${params.userId}),and(sender_id.eq.${params.userId},recipient_id.eq.${viewer.id})`
    )
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark incoming as read
  await db
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', viewer.id)
    .eq('sender_id', params.userId)
    .is('read_at', null)

  const messages = (data ?? []) as Message[]
  const emailMap = await getAuthEmailMap([params.userId])
  const otherHandle = toPublicHandle(emailMap.get(params.userId))

  // Group consecutive messages by sender for a clean chat layout
  type Group = { senderId: string; messages: Message[] }
  const groups: Group[] = []
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    if (last && last.senderId === msg.sender_id) {
      last.messages.push(msg)
    } else {
      groups.push({ senderId: msg.sender_id, messages: [msg] })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Fixed-height thread container */}
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 px-4" style={{ height: 'calc(100vh - 52px)' }}>

        {/* Thread header */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <Link href="/messages" className="text-gray-400 hover:text-gray-600 transition-colors p-1 -ml-1">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
            {otherHandle.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{otherHandle}</p>
            <p className="text-xs text-gray-400">Direct message</p>
          </div>
        </div>

        {/* Scrollable message list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 scroll-smooth">
          {!messages.length ? (
            <p className="text-center text-sm text-gray-400 py-12">
              No messages yet — say hi 👋
            </p>
          ) : (
            groups.map((group, gi) => {
              const isMine = group.senderId === viewer.id
              return (
                <div key={gi} className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {/* Avatar for other person */}
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-semibold flex-shrink-0 mb-0.5">
                      {otherHandle.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {group.messages.map((msg, mi) => (
                      <div key={msg.id}>
                        <div className={`px-3.5 py-2 text-sm leading-relaxed ${
                          isMine
                            ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        </div>
                        {/* Show timestamp only on last message in group */}
                        {mi === group.messages.length - 1 && (
                          <p className={`text-[10px] mt-1 px-1 ${isMine ? 'text-gray-400 text-right' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
          {/* Anchor: scrolled-to on mount */}
          <ChatScrollAnchor />
        </div>

        {/* Compose bar */}
        <div className="py-3 flex-shrink-0">
          <MessageCompose recipientId={params.userId} />
        </div>

      </div>
    </div>
  )
}
