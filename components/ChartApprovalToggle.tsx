'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ChartApprovalToggle({ presId, initialApproved }: { presId: string; initialApproved: boolean }) {
  const [approved, setApproved] = useState(initialApproved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggle = async () => {
    setLoading(true)
    const next = !approved
    await supabase.from('presentations').update({ chart_approved: next }).eq('id', presId)
    setApproved(next)
    setLoading(false)
    router.refresh()
  }

  if (approved) {
    return (
      <button onClick={toggle} disabled={loading}
        className="text-[11px] tracking-widest uppercase border border-green-600 bg-green-600 text-white px-4 py-2 hover:bg-green-700 hover:border-green-700 transition-colors disabled:opacity-50">
        {loading ? '…' : '✓ Approved — Revoke'}
      </button>
    )
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="text-[11px] tracking-widest uppercase border border-black bg-black text-white px-4 py-2 hover:bg-neutral-800 transition-colors disabled:opacity-50">
      {loading ? '…' : 'Approve for Clients'}
    </button>
  )
}
