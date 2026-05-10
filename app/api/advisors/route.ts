import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const dept = searchParams.get('dept') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  let query = supabase
    .from('advisors')
    .select(`
      *,
      departments(name),
      advisor_aggregates(
        review_count, avg_overall, avg_mentorship,
        avg_funding, avg_worklife, avg_communication, avg_career
      )
    `)
    .eq('active', true)
    .order('name')
    .range((page - 1) * limit, page * limit - 1)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }
  if (dept) {
    query = query.eq('dept_id', dept)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ advisors: data })
}
