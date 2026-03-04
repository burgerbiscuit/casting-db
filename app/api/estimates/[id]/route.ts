import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireTeam(authSupabase: any) {
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return null
  const { data: tm } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!tm) return null
  return user
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('estimates')
    .select('*, projects(name, client_emails), estimate_items(*)')
    .eq('id', params.id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const supabase = await createServiceClient()

  const subtotal =
    Number(body.casting_fee || 0) +
    Number(body.talent_budget || 0) +
    Number(body.expenses || 0) +
    (body.items || []).reduce((s: number, i: any) => s + Number(i.amount || 0), 0)

  const { error } = await supabase.from('estimates').update({
    project_id: body.project_id,
    estimate_number: body.estimate_number,
    client_name: body.client_name,
    client_email: body.client_email,
    issue_date: body.issue_date,
    valid_until: body.valid_until || null,
    casting_fee: Number(body.casting_fee || 0),
    talent_budget: Number(body.talent_budget || 0),
    expenses: Number(body.expenses || 0),
    subtotal,
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.items !== undefined) {
    await supabase.from('estimate_items').delete().eq('estimate_id', params.id)
    if (body.items.length) {
      await supabase.from('estimate_items').insert(
        body.items.map((item: any) => ({
          estimate_id: params.id,
          description: item.description,
          quantity: Number(item.quantity || 1),
          rate: Number(item.rate || 0),
          amount: Number(item.amount || 0),
        }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { error } = await supabase.from('estimates').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
