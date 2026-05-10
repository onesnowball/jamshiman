import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActionClient } from '@/lib/server-auth'
import { getAuthEmailMap, toPublicHandle } from '@/lib/admin-users'

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

  const { supabase } = await getActionClient()
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'active')
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

  const emailMap = await getAuthEmailMap(posts.map(post => post.author_id))

  const formattedPosts = await Promise.all(posts.map(async post => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('status', 'active')

    return {
      ...post,
      comment_count: count ?? 0,
      author_label: post.is_anonymous ? 'Anonymous' : toPublicHandle(emailMap.get(post.author_id)),
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
    // Look up university slug for the URL
    const { data: courseUni } = await supabase.from('universities').select('domain').eq('id', (course as { university_id: string }).university_id).single()
    const courseSchool = courseUni ? (courseUni as { domain: string }).domain.split('.')[0] : 'umich'
    postUrl = `/${courseSchool}/courses/${parsed.data.course_id}/discussion`
  } else {
    const { data: department } = await supabase
      .from('departments')
      .select('id, slug, university_id')
      .eq('id', parsed.data.dept_id!)
      .single()

    if (!department) {
      return NextResponse.json({ error: 'Department not found.' }, { status: 404 })
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

    // Look up university slug for the URL
    const { data: deptUni } = await supabase.from('universities').select('domain').eq('id', (department as { university_id: string }).university_id).single()
    const deptSchool = deptUni ? (deptUni as { domain: string }).domain.split('.')[0] : 'umich'
    postUrl = `/${deptSchool}/boards/${(department as { slug: string }).slug}`
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
