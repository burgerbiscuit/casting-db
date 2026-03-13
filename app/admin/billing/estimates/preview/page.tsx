'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EstimatePreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const form = {
    project_id: searchParams.get('project_id') || '',
    estimate_number: searchParams.get('estimate_number') || '',
    client_name: searchParams.get('client_name') || '',
    client_email: searchParams.get('client_email') || '',
    billing_contact_name: searchParams.get('billing_contact_name') || '',
    billing_contact_phone: searchParams.get('billing_contact_phone') || '',
    billing_contact_email: searchParams.get('billing_contact_email') || '',
    billing_contact_address: searchParams.get('billing_contact_address') || '',
    issue_date: searchParams.get('issue_date') || '',
    valid_until: searchParams.get('valid_until') || '',
    scope_description: searchParams.get('scope_description') || '',
    casting_fee: searchParams.get('casting_fee') || '',
    notes: searchParams.get('notes') || '',
  }

  const recipients = [
    form.client_email,
    'tasha@tashatongpreecha.com'
  ].filter(Boolean)

  const send = async () => {
    setSending(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase.from('estimates').insert({
      ...form,
      project_id: form.project_id || null,
      casting_fee: parseFloat(form.casting_fee) || 0,
      created_by: user?.id,
    }).select().single()

    setSending(false)
    if (err) { setError(err.message); return }

    // TODO: Send email via API when ready
    // For now, just created the record successfully
    router.push(`/admin/billing?tab=estimates`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <button onClick={() => window.history.back()} className="text-neutral-400 hover:text-black transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase">Confirm & Send Estimate</h1>
          <p className="text-sm text-neutral-400 mt-1">Review the estimate below and confirm recipients</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Preview */}
        <div className="col-span-2">
          <div className="border border-neutral-200 p-8 bg-white">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-sm tracking-widest uppercase font-medium mb-4">Estimate</h2>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-widest mb-0.5">ESTIMATE #</p>
                  <p className="text-lg font-medium">{form.estimate_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-400 tracking-widest mb-0.5">ISSUE DATE</p>
                  <p className="text-sm">{form.issue_date}</p>
                </div>
              </div>
            </div>

            <hr className="my-6" />

            {/* Billing Contact */}
            <div className="mb-8">
              <p className="text-xs text-neutral-400 tracking-widest mb-3">BILLING CONTACT</p>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{form.billing_contact_name}</p>
                <p>{form.billing_contact_email}</p>
                {form.billing_contact_phone && <p>{form.billing_contact_phone}</p>}
                {form.billing_contact_address && <p>{form.billing_contact_address}</p>}
              </div>
            </div>

            <hr className="my-6" />

            {/* Scope & Fee */}
            <div className="mb-8">
              <p className="text-xs text-neutral-400 tracking-widest mb-3">SCOPE OF WORK</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{form.scope_description}</p>
            </div>

            <div className="mb-8">
              <p className="text-xs text-neutral-400 tracking-widest mb-3">CASTING DIRECTOR FEE</p>
              <p className="text-3xl font-light">${parseFloat(form.casting_fee).toFixed(2)}</p>
            </div>

            {form.valid_until && (
              <>
                <hr className="my-6" />
                <div>
                  <p className="text-xs text-neutral-400 tracking-widest mb-1">VALID UNTIL</p>
                  <p className="text-sm">{form.valid_until}</p>
                </div>
              </>
            )}

            {form.notes && (
              <>
                <hr className="my-6" />
                <div>
                  <p className="text-xs text-neutral-400 tracking-widest mb-2">NOTES</p>
                  <p className="text-sm whitespace-pre-wrap">{form.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recipients & Actions */}
        <div>
          <div className="border border-neutral-200 p-6 sticky top-8">
            <p className="text-xs tracking-widest uppercase font-medium mb-4">Send to</p>
            <div className="space-y-2 mb-6">
              {recipients.map((email, i) => (
                <div key={i} className="bg-neutral-50 px-3 py-2 text-xs rounded">
                  {email}
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

            <div className="space-y-2">
              <button onClick={send} disabled={sending}
                className="w-full bg-black text-white px-4 py-2.5 text-xs tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                {sending ? 'Sending...' : 'Send Estimate'}
              </button>
              <button onClick={() => window.history.back()}
                className="w-full border border-neutral-200 px-4 py-2.5 text-xs tracking-widest uppercase hover:bg-neutral-50 transition-colors">
                ← Back to Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
