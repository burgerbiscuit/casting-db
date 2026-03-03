import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const TASHA_USER_ID = '328944d5-bf72-424d-874b-8f21b363464a'

export async function POST(req: NextRequest) {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (user?.id !== TASHA_USER_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const supabase = await createServiceClient()

  const { data, error } = await supabase.from('invoices').insert({
    project_id: body.project_id,
    client_name: body.client_name,
    client_email: body.client_email,
    invoice_number: body.invoice_number,
    issue_date: body.issue_date,
    due_date: body.due_date,
    subtotal: body.subtotal || 0,
    tax_rate: body.tax_rate || 0,
    tax_amount: body.tax_amount || 0,
    total: body.total || 0,
    status: 'draft',
    notes: body.notes,
    created_by: user?.id,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.items?.length) {
    await supabase.from('invoice_items').insert(
      body.items.map((item: any) => ({ ...item, invoice_id: data.id }))
    )
  }

  return NextResponse.json({ id: data.id })
}

export async function GET(req: NextRequest) {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (user?.id !== TASHA_USER_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data } = await supabase.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
