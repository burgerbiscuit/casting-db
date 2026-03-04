import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireTeam(authSupabase: any) {
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return null
  const { data: tm } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!tm) return null
  return user
}

export async function GET(req: NextRequest) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('estimates')
    .select('*, projects(name), estimate_items(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const supabase = await createServiceClient()

  const subtotal = Number(body.casting_fee || 0)

  const { data, error } = await supabase.from('estimates').insert({
    billing_contact_name: body.billing_contact_name,
    billing_contact_phone: body.billing_contact_phone,
    billing_contact_email: body.billing_contact_email,
    billing_contact_address: body.billing_contact_address,
    scope_description: body.scope_description,
    project_id: body.project_id || null,
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
    status: 'draft',
    created_by: user.id,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.items?.length) {
    await supabase.from('estimate_items').insert(
      body.items.map((item: any) => ({
        estimate_id: data.id,
        description: item.description,
        quantity: Number(item.quantity || 1),
        rate: Number(item.rate || 0),
        amount: Number(item.amount || 0),
      }))
    )
  }

  return NextResponse.json({ id: data.id })
}
