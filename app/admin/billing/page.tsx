'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function BillingPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*, projects(name, client_name)')
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  const statusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-50 border-green-200'
      case 'sent': return 'bg-blue-50 border-blue-200'
      case 'overdue': return 'bg-red-50 border-red-200'
      default: return 'bg-neutral-50 border-neutral-200'
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { paid: 'bg-green-100 text-green-700', sent: 'bg-blue-100 text-blue-700', overdue: 'bg-red-100 text-red-700', draft: 'bg-neutral-100 text-neutral-700' }
    return colors[status] || colors.draft
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-light tracking-widest uppercase">Invoices</h1>
        <Link href="/admin/billing/new"
          className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors">
          <Plus size={14} /> New Invoice
        </Link>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading...</p>
      ) : invoices.length === 0 ? (
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
                <span className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded ${statusBadge(inv.status)}`}>
                  {inv.status}
                </span>
                <Download size={14} className="text-neutral-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
