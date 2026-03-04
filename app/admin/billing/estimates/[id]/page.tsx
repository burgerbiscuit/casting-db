'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Download, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function EstimateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [estimate, setEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/estimates/${id}`)
    const data = await res.json()
    setEstimate(data)
    setLoading(false)
  }

  const sendForSignature = async () => {
    if (!estimate?.client_email) return alert('No client email set')
    setSending(true)
    const res = await fetch(`/api/estimates/${id}/send`, { method: 'POST' })
    setSending(false)
    if (res.ok) {
      setSent(true)
      setEstimate((e: any) => ({ ...e, status: 'sent' }))
    } else {
      alert('Failed to send email')
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-neutral-100 text-neutral-600',
      sent: 'bg-blue-100 text-blue-700',
      signed: 'bg-green-100 text-green-700',
    }
    return map[status] || map.draft
  }

  const fmt = (n: number) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
  const label = 'text-[9px] tracking-widest uppercase text-neutral-400 block mb-1'

  if (loading) return <p className="text-neutral-400">Loading...</p>
  if (!estimate || estimate.error) return <p className="text-neutral-400">Estimate not found.</p>

  const items = estimate.estimate_items || []
  const projectName = estimate.projects?.name || ''

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin/billing" className="text-[9px] tracking-widest uppercase text-neutral-400 hover:text-black">← Billing</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">{estimate.estimate_number}</h1>
          {projectName && <p className="text-sm text-neutral-500 mt-1">{projectName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] tracking-widest uppercase px-3 py-1 ${statusBadge(estimate.status)}`}>
            {estimate.status}
          </span>
          <a href={`/api/estimates/${id}/pdf`} target="_blank"
            className="flex items-center gap-1 text-[10px] tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors">
            <Download size={12} /> PDF
          </a>
          {estimate.status !== 'signed' && (
            <button onClick={sendForSignature} disabled={sending}
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-2 hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              <Send size={12} /> {sending ? 'Sending...' : 'Send for Signature'}
            </button>
          )}
        </div>
      </div>

      {sent && (
        <div className="flex items-center gap-2 text-green-700 text-xs tracking-wider bg-green-50 border border-green-200 px-4 py-3 mb-6">
          <CheckCircle size={14} /> Email sent to {estimate.client_email}
        </div>
      )}

      <div className="space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className={label}>Issue Date</p>
            <p>{estimate.issue_date ? new Date(estimate.issue_date).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className={label}>Valid Until</p>
            <p>{estimate.valid_until ? new Date(estimate.valid_until).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className={label}>Client</p>
            <p>{estimate.client_name || '—'}</p>
            {estimate.client_email && <p className="text-xs text-neutral-500">{estimate.client_email}</p>}
          </div>
        </div>

        {/* Line items */}
        <div>
          <p className={label + ' mb-3'}>Line Items</p>
          <div className="border border-neutral-100">
            <div className="grid grid-cols-12 gap-2 text-[9px] tracking-widest uppercase text-neutral-400 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {Number(estimate.casting_fee) > 0 && (
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-50 text-sm">
                <div className="col-span-6">Casting Fee</div>
                <div className="col-span-2 text-center">1</div>
                <div className="col-span-2 text-right">{fmt(estimate.casting_fee)}</div>
                <div className="col-span-2 text-right">{fmt(estimate.casting_fee)}</div>
              </div>
            )}
            {Number(estimate.talent_budget) > 0 && (
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-50 text-sm">
                <div className="col-span-6">Talent Budget</div>
                <div className="col-span-2 text-center">1</div>
                <div className="col-span-2 text-right">{fmt(estimate.talent_budget)}</div>
                <div className="col-span-2 text-right">{fmt(estimate.talent_budget)}</div>
              </div>
            )}
            {Number(estimate.expenses) > 0 && (
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-50 text-sm">
                <div className="col-span-6">Expenses</div>
                <div className="col-span-2 text-center">1</div>
                <div className="col-span-2 text-right">{fmt(estimate.expenses)}</div>
                <div className="col-span-2 text-right">{fmt(estimate.expenses)}</div>
              </div>
            )}
            {items.map((item: any) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-50 text-sm">
                <div className="col-span-6">{item.description}</div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-2 text-right">{fmt(item.rate)}</div>
                <div className="col-span-2 text-right">{fmt(item.amount)}</div>
              </div>
            ))}
            <div className="flex justify-end px-4 py-4 border-t border-black">
              <div className="text-right">
                <p className={label}>Total</p>
                <p className="text-xl font-light">{fmt(estimate.subtotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div>
            <p className={label}>Notes</p>
            <p className="text-sm text-neutral-600 whitespace-pre-wrap">{estimate.notes}</p>
          </div>
        )}

        {/* Signature */}
        {estimate.status === 'signed' && (
          <div className="border-t border-neutral-200 pt-6">
            <p className={label + ' mb-3'}>Signature</p>
            {estimate.signature_data && (
              <img src={estimate.signature_data} alt="Signature" className="max-h-20 border-b border-black pb-2 mb-2" />
            )}
            <p className="text-xs text-neutral-500">
              Signed {estimate.signed_at ? new Date(estimate.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
