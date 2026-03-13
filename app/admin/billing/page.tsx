'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TASHA_USER_ID = '328944d5-bf72-424d-874b-8f21b363464a'
import { createClient } from '@/lib/supabase/client'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function BillingPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id !== TASHA_USER_ID) router.replace('/admin')
    })
  }, [])

  const [tab, setTab] = useState<'invoices' | 'estimates'>('invoices')
  const [invoices, setInvoices] = useState<any[]>([])
  const [estimates, setEstimates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [tab])

  const load = async () => {
    setLoading(true)
    if (tab === 'invoices') {
      const { data } = await supabase
        .from('invoices')
        .select('*, projects(name, client_name)')
        .order('created_at', { ascending: false })
      setInvoices(data || [])
    } else {
      const res = await fetch('/api/estimates')
      const data = await res.json()
      setEstimates(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }

  const statusColor = (status: string) => {
    switch(status) {
      case 'paid': case 'signed': return 'bg-green-50 border-green-200'
      case 'sent': return 'bg-blue-50 border-blue-200'
      case 'overdue': return 'bg-red-50 border-red-200'
      default: return 'bg-neutral-50 border-neutral-200'
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      signed: 'bg-green-100 text-green-700',
      sent: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      draft: 'bg-neutral-100 text-neutral-700'
    }
    return colors[status] || colors.draft
  }

  return (
    <div className="max-w-4xl">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-0 border border-black">
          {(['invoices', 'estimates'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs tracking-widest uppercase px-5 py-2 transition-colors ${tab === t ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'}`}>
              {t}
            </button>
          ))}
        </div>
        {tab === 'invoices' ? (
          <Link href="/admin/billing/invoices/new"
            className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors">
            <Plus size={14} /> New Invoice
          </Link>
        ) : (
          <Link href="/admin/billing/estimates/new"
            className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors">
            <Plus size={14} /> New Estimate
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading...</p>
      ) : tab === 'invoices' ? (
        invoices.length === 0 ? (
          <p className="text-center text-neutral-400 py-8">No invoices yet</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <Link key={inv.id} href={`/admin/billing/${inv.id}`}
                className={`flex items-center justify-between px-4 py-3 border text-sm cursor-pointer hover:bg-neutral-50 transition-colors ${statusColor(inv.status)}`}>
                <div className="flex-1">
                  <p className="font-medium">{inv.projects?.name || 'Project'}</p>
                  <p className="text-neutral-500 text-xs">{inv.invoice_number} • {inv.client_name}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-medium">${(inv.total || 0).toFixed(2)}</p>
                    <p className="text-neutral-500 text-xs">{new Date(inv.due_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${statusBadge(inv.status)}`}>{inv.status}</span>
                  <Download size={14} className="text-neutral-300" />
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        estimates.length === 0 ? (
          <p className="text-center text-neutral-400 py-8">No estimates yet</p>
        ) : (
          <div className="space-y-2">
            {estimates.map(est => (
              <Link key={est.id} href={`/admin/billing/estimates/${est.id}`}
                className={`flex items-center justify-between px-4 py-3 border text-sm cursor-pointer hover:bg-neutral-50 transition-colors ${statusColor(est.status)}`}>
                <div className="flex-1">
                  <p className="font-medium">{est.projects?.name || 'Project'}</p>
                  <p className="text-neutral-500 text-xs">{est.estimate_number} • {est.client_name}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-medium">${(est.subtotal || 0).toFixed(2)}</p>
                    <p className="text-neutral-500 text-xs">{est.issue_date ? new Date(est.issue_date).toLocaleDateString() : ''}</p>
                  </div>
                  <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${statusBadge(est.status)}`}>{est.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
