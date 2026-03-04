import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('estimates')
    .select('*, projects(name), estimate_items(*)')
    .eq('sign_token', params.token)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = await createServiceClient()
  const { data: estimate } = await supabase
    .from('estimates')
    .select('id, status')
    .eq('sign_token', params.token)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (estimate.status === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 400 })

  const body = await req.json()
  const { signature_data } = body

  const { error } = await supabase.from('estimates').update({
    signature_data,
    signed_at: new Date().toISOString(),
    status: 'signed',
    updated_at: new Date().toISOString(),
  }).eq('id', estimate.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
