import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'
import { getAuthEmailMap, getHandleMap, getAuthorLabel } from '@/lib/admin-users'

const PostSchema = z.object({
  dept_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  title: z.string().min(4).max(120),
  body: z.string().min(10).max(5000),
  is_anonymous: z.boolean(),
}).refine(
  data => Number(Boolean(data.dept_id)) + Number(Boolean(data.course_id)) === 1,
  { message: 'Provide exactly one posting context: dept_id or course_id.' }
)

const BoardQuerySchema = z.object({
  dept_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  board_type: z.enum(['department', 'course']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export async function GET(req: NextRequest) {
  // H-8: Require authentication and scope posts to the viewer's university.
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = BoardQuerySchema.safeParse({
    dept_id: searchParams.get('dept_id') ?? undefined,
    course_id: searchParams.get('course_id') ?? undefined,
    board_type: searchParams.get('board_type') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'active')
    .eq('university_id', viewer.university_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit)

  if (parsed.data.course_id) {
    query = query
      .eq('course_id', parsed.data.course_id)
      .eq('board_type', 'course')
  } else if (parsed.data.dept_id) {
    query = query
      .eq('dept_id', parsed.data.dept_id)
      .eq('board_type', 'department')
  } else if (parsed.data.board_type) {
    query = query.eq('board_type', parsed.data.board_type)
  }

  const { data: postsData, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const posts = (postsData ?? []) as Array<{
    id: string
    author_id: string
    course_id: string | null
    dept_id: string
    board_type: 'department' | 'course'
    title: string
    body: string
    is_anonymous: boolean
    created_at: string
  }>

  const authorIds = posts.map(post => post.author_id)
  const [emailMap, handleMap] = await Promise.all([
    getAuthEmailMap(authorIds),
    getHandleMap(authorIds),
  ])

  const formattedPosts = await Promise.all(posts.map(async post => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('status', 'active')

    return {
      ...post,
      comment_count: count ?? 0,
      author_label: post.is_anonymous ? 'Anonymous' : getAuthorLabel(post.author_id, handleMap, emailMap),
    }
  }))

  return NextResponse.json({ posts: formattedPosts })
}

export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) {
    return NextResponse.json({ error: 'You need to sign in to post.' }, { status: 401 })
  }

  if (viewer.is_banned) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  // 5-minute cooldown between new posts per user
  const COOLDOWN_MS = 5 * 60 * 1000
  const { data: lastPost } = await supabase
    .from('posts')
    .select('created_at')
    .eq('author_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (lastPost) {
    const elapsed = Date.now() - new Date((lastPost as { created_at: string }).created_at).getTime()
    if (elapsed < COOLDOWN_MS) {
      const secondsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
      const mins = Math.floor(secondsLeft / 60)
      const secs = secondsLeft % 60
      const wait = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
      return NextResponse.json(
        { error: `You can post again in ${wait}.` },
        { status: 429 }
      )
    }
  }

  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    const msgs = parsed.error.flatten()
    const first =
      msgs.formErrors[0] ??
      Object.values(msgs.fieldErrors).flat()[0] ??
      'Invalid input.'
    return NextResponse.json({ error: first }, { status: 400 })
  }

  // Derive the school slug from the viewer's verified email domain
  // e.g. "user@northwestern.edu" → "northwestern"
  // This avoids an extra DB lookup and can never fall back to the wrong school.
  const schoolSlug = viewer.email
    ? (viewer.email.split('@')[1] ?? '').split('.')[0]
    : null

  if (!schoolSlug) {
    return NextResponse.json({ error: 'Could not determine your university.' }, { status: 400 })
  }

  const supabaseAny = supabase as any
  let insertPayload: Record<string, unknown>
  let postUrl = ''

  if (parsed.data.course_id) {
    const { data: course } = await supabase
      .from('courses')
      .select('id, dept_id, university_id')
      .eq('id', parsed.data.course_id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    }

    // H-4: Prevent cross-school posting — user must belong to the same university.
    if ((course as { university_id: string }).university_id !== viewer.university_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    insertPayload = {
      author_id: viewer.id,
      dept_id: (course as { dept_id: string }).dept_id,
      course_id: parsed.data.course_id,
      university_id: (course as { university_id: string }).university_id,
      board_type: 'course',
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      is_anonymous: parsed.data.is_anonymous,
      status: 'active',
    }
    postUrl = `/${schoolSlug}/courses/${parsed.data.course_id}/discussion`
  } else {
    const { data: department } = await supabase
      .from('departments')
      .select('id, slug, university_id')
      .eq('id', parsed.data.dept_id!)
      .single()

    if (!department) {
      return NextResponse.json({ error: 'Department not found.' }, { status: 404 })
    }

    // H-4: Prevent cross-school posting — user must belong to the same university.
    if ((department as { university_id: string }).university_id !== viewer.university_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    insertPayload = {
      author_id: viewer.id,
      dept_id: parsed.data.dept_id,
      course_id: null,
      university_id: (department as { university_id: string }).university_id,
      board_type: 'department',
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      is_anonymous: parsed.data.is_anonymous,
      status: 'active',
    }
    postUrl = `/${schoolSlug}/boards/${(department as { slug: string }).slug}`
  }

  const { data, error } = await supabaseAny
    .from('posts')
    .insert(insertPayload)
    .select('id, course_id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create post.' }, { status: 500 })
  }

  postUrl = `${postUrl}/${data.id}`

  return NextResponse.json({
    postId: data.id,
    postUrl,
  }, { status: 201 })
}
