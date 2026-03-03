import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'

const TASHA_USER_ID = 'f5fe2bb4-f429-4978-a052-6f00cc614ff8'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'model'

  // Require auth for production contacts (any team member)
  if (type === 'production') {
    const serverSupabase = await createServiceClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let all: any[] = []
  let from = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('agency_contacts')
      .select('*')
      .eq('contact_type', type)
      .order('agency_name')
      .range(from, from + batchSize - 1)
    if (error || !data || data.length === 0) break
    all = all.concat(data)
    if (data.length < batchSize) break
    from += batchSize
  }
  return NextResponse.json(all)
}

export async function PATCH(req: Request) {
  const { id, is_main_contact } = await req.json()
  const supabase = await createServiceClient()
  const { error } = await supabase.from('agency_contacts').update({ is_main_contact }).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
