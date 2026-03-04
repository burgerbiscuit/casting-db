'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function SignPage() {
  const params = useParams()
  const token = params.token as string
  const [estimate, setEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.json())
      .then(data => { setEstimate(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
    setHasStrokes(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDraw = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const submit = async () => {
    if (!hasStrokes) return alert('Please sign before submitting.')
    const canvas = canvasRef.current
    if (!canvas) return
    const signature_data = canvas.toDataURL('image/png')
    setSigning(true)
    const res = await fetch(`/api/sign/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature_data }),
    })
    setSigning(false)
    if (res.ok) setDone(true)
    else {
      const data = await res.json()
      alert(data.error || 'Failed to sign')
    }
  }

  const fmt = (n: number) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
  const label = 'text-[9px] tracking-widest uppercase text-neutral-400 block mb-1'

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-neutral-400 text-sm tracking-widest">Loading...</p>
    </div>
  )

  if (!estimate || estimate.error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-neutral-400">Estimate not found.</p>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-[9px] tracking-widest uppercase text-neutral-400 mb-6">Tasha Tongpreecha Casting</p>
        <p className="text-xl font-light tracking-widest uppercase mb-3">Estimate Signed</p>
        <p className="text-sm text-neutral-500">Thank you. Your signature has been recorded.</p>
      </div>
    </div>
  )

  if (estimate.status === 'signed') return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-[9px] tracking-widest uppercase text-neutral-400 mb-6">Tasha Tongpreecha Casting</p>
        <p className="text-xl font-light tracking-widest uppercase mb-3">Already Signed</p>
        <p className="text-sm text-neutral-500">
          This estimate was signed on{' '}
          {estimate.signed_at
            ? new Date(estimate.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'a prior date'}.
        </p>
      </div>
    </div>
  )

  const items = estimate.estimate_items || []
  const projectName = estimate.projects?.name || ''

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Header */}
        <p className="text-[9px] tracking-widest uppercase text-neutral-400 mb-8">Tasha Tongpreecha Casting</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-2">Casting Estimate</h1>
        <p className="text-sm text-neutral-500 mb-8">{estimate.estimate_number}{projectName ? ` — ${projectName}` : ''}</p>

        {/* Bill to */}
        <div className="mb-8">
          <p className={label}>Prepared For</p>
          <p className="text-sm font-medium">{estimate.client_name}</p>
          {estimate.client_email && <p className="text-xs text-neutral-500">{estimate.client_email}</p>}
        </div>

        {/* Line items */}
        <div className="border border-neutral-100 mb-8">
          <div className="grid grid-cols-8 text-[9px] tracking-widest uppercase text-neutral-400 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
            <div className="col-span-5">Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          {Number(estimate.casting_fee) > 0 && (
            <div className="grid grid-cols-8 px-4 py-3 border-b border-neutral-50 text-sm">
              <div className="col-span-5">Casting Fee</div>
              <div className="col-span-1 text-center">1</div>
              <div className="col-span-2 text-right">{fmt(estimate.casting_fee)}</div>
            </div>
          )}
          {Number(estimate.talent_budget) > 0 && (
            <div className="grid grid-cols-8 px-4 py-3 border-b border-neutral-50 text-sm">
              <div className="col-span-5">Talent Budget</div>
              <div className="col-span-1 text-center">1</div>
              <div className="col-span-2 text-right">{fmt(estimate.talent_budget)}</div>
            </div>
          )}
          {Number(estimate.expenses) > 0 && (
            <div className="grid grid-cols-8 px-4 py-3 border-b border-neutral-50 text-sm">
              <div className="col-span-5">Expenses</div>
              <div className="col-span-1 text-center">1</div>
              <div className="col-span-2 text-right">{fmt(estimate.expenses)}</div>
            </div>
          )}
          {items.map((item: any) => (
            <div key={item.id} className="grid grid-cols-8 px-4 py-3 border-b border-neutral-50 text-sm">
              <div className="col-span-5">{item.description}</div>
              <div className="col-span-1 text-center">{item.quantity}</div>
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

        {/* Notes */}
        {estimate.notes && (
          <div className="mb-8">
            <p className={label}>Notes</p>
            <p className="text-sm text-neutral-600 whitespace-pre-wrap">{estimate.notes}</p>
          </div>
        )}

        {/* Signature pad */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className={label}>Signature</p>
            <button onClick={clearCanvas} className="text-[9px] tracking-widest uppercase text-neutral-400 hover:text-black">Clear</button>
          </div>
          <canvas
            ref={canvasRef}
            width={560}
            height={160}
            className="w-full border border-neutral-200 touch-none cursor-crosshair bg-white"
            style={{ touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <p className="text-[9px] text-neutral-400 mt-1">Draw your signature above</p>
        </div>

        <button onClick={submit} disabled={signing}
          className="w-full bg-black text-white text-xs tracking-widest uppercase py-4 hover:bg-neutral-800 disabled:opacity-50 transition-colors">
          {signing ? 'Submitting...' : 'Sign & Submit'}
        </button>

        <p className="text-[9px] text-neutral-400 text-center mt-6 tracking-wider">
          tasha@tashatongpreecha.com
        </p>
      </div>
    </div>
  )
}
