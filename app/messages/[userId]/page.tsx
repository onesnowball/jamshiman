import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { getOptionalViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'
import { createAdminClient } from '@/lib/supabase/server'
import { MessageCompose } from '@/components/messages/MessageCompose'

type Message = {
  id: string; sender_id: string; recipient_id: string
  body: string; read_at: string | null; created_at: string
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar isAdmin={viewer.role === 'admin'} />
      <main className="max-w-2xl mx-auto w-full px-4 py-6 page-enter flex flex-col gap-4" style={{ minHeight: 'calc(100vh - 52px)' }}>

        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold">
            {otherHandle.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-base font-semibold text-gray-900">{otherHandle}</h1>
        </div>

        <div className="flex-1 space-y-2">
          {!messages.length ? (
            <p className="text-center text-sm text-gray-400 py-12">No messages yet. Say hi!</p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === viewer.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.sender_id === viewer.id
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                }`}>
                  <p>{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender_id === viewer.id ? 'text-brand-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-4">
          <MessageCompose recipientId={params.userId} />
        </div>
      </main>
    </div>
  )
}
