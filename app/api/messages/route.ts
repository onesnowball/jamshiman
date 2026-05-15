import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireViewer } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'

type Message = {
  id: string; sender_id: string; recipient_id: string
  body: string; read_at: string | null; created_at: string
}

export async function GET() {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const { data } = await (supabase as any)
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${viewer.id},recipient_id.eq.${viewer.id}`)
    .order('created_at', { ascending: false })
    .limit(200)

  const messages = (data ?? []) as Message[]
  const convoMap = new Map<string, { otherId: string; lastMessage: Message; unread: number }>()
  for (const msg of messages) {
    const otherId = msg.sender_id === viewer.id ? msg.recipient_id : msg.sender_id
    if (!convoMap.has(otherId)) convoMap.set(otherId, { otherId, lastMessage: msg, unread: 0 })
    if (msg.recipient_id === viewer.id && !msg.read_at) convoMap.get(otherId)!.unread++
  }

  const otherIds = Array.from(convoMap.keys())
  const emailMap = await getAuthEmailMap(otherIds)
  const conversations = otherIds.map(id => ({
    userId: id,
    handle: toPublicHandle(emailMap.get(id)),
    lastMessage: convoMap.get(id)!.lastMessage,
    unread: convoMap.get(id)!.unread,
  }))

  return NextResponse.json({ conversations })
}

const SendSchema = z.object({
  recipient_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  const auth = await requireViewer()
  if (auth.error) return auth.error
  const { viewer, supabase } = auth

  const parsed = SendSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  if (parsed.data.recipient_id === viewer.id) {
    return NextResponse.json({ error: 'Cannot message yourself.' }, { status: 400 })
  }

  // Cross-school check: a user can only DM others in the same school.
  // Without this, anyone who knows a recipient's user-id could message
  // them across schools. Global admins are exempt.
  if (viewer.role !== 'admin') {
    const { data: recipient } = await supabase
      .from('users')
      .select('university_id, is_banned')
      .eq('id', parsed.data.recipient_id)
      .maybeSingle()
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 })
    }
    const r = recipient as { university_id: string; is_banned: boolean }
    if (r.university_id !== viewer.university_id) {
      return NextResponse.json({ error: 'Cannot message users from a different school.' }, { status: 403 })
    }
    if (r.is_banned) {
      return NextResponse.json({ error: 'Recipient is suspended.' }, { status: 403 })
    }
  }

  const { error } = await (supabase as any)
    .from('messages')
    .insert({ sender_id: viewer.id, recipient_id: parsed.data.recipient_id, body: parsed.data.body.trim() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
