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
  const [alreadySigned, setAlreadySigned] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [signerCompany, setSignerCompany] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'signed') setAlreadySigned(true)
        setEstimate(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    setDrawing(true); setHasStrokes(true)
  }
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
  }
  const stopDraw = () => setDrawing(false)
  const clearSig = () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const submit = async () => {
    if (!hasStrokes) { setError('Please sign above before submitting.'); return }
    if (!signerName) { setError('Please enter your name.'); return }
    setSigning(true); setError('')
    const canvas = canvasRef.current!
    const signature_data = canvas.toDataURL('image/png')
    const res = await fetch(`/api/sign/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature_data, signer_name: signerName, signer_title: signerTitle, signer_company: signerCompany })
    })
    setSigning(false)
    if (res.ok) setDone(true)
    else setError('Something went wrong. Please try again.')
  }

  const fmt = (n: number) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' USD'
  const inputClass = "w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
  const labelClass = "block text-[10px] tracking-widest uppercase text-neutral-500 mb-1"

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-sm text-neutral-400">Loading...</p></main>
  if (!estimate || estimate.error) return <main className="min-h-screen flex items-center justify-center"><p className="text-sm text-neutral-500">Estimate not found.</p></main>

  if (done) return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-4" />
        <p className="text-sm text-neutral-600 mb-2">Estimate signed. Thank you.</p>
        <p className="text-xs text-neutral-400">You'll receive a copy by email shortly.</p>
      </div>
    </main>
  )

  if (alreadySigned) return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-4" />
        <p className="text-sm text-neutral-600">This estimate has already been signed{estimate.signed_at ? ` on ${new Date(estimate.signed_at).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}` : ''}.
        </p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pb-4 border-b border-neutral-200">
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-2" />
          <p className="text-[10px] tracking-widest uppercase text-neutral-400">Casting Estimate — Please Review & Sign</p>
        </div>

        {/* Summary */}
        <div className="mb-8">
          {estimate.projects?.name && <p className="text-xs tracking-wider uppercase text-neutral-500 mb-1">{estimate.projects.name}</p>}
          <p className="text-xs text-neutral-500 mb-4">{estimate.estimate_number} · Issued {new Date(estimate.issue_date).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>

          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-neutral-100">
                <th className="text-left text-[10px] tracking-widest uppercase px-3 py-2 border border-neutral-200 font-medium">Casting Director</th>
                <th className="text-right text-[10px] tracking-widest uppercase px-3 py-2 border border-neutral-200 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-3 border border-neutral-200 text-sm whitespace-pre-wrap">{estimate.scope_description}</td>
                <td className="px-3 py-3 border border-neutral-200 text-sm text-right whitespace-nowrap">{fmt(estimate.casting_fee)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="px-3 py-2 border border-neutral-200 text-sm font-medium">Total</td>
                <td className="px-3 py-2 border border-neutral-200 text-sm font-medium text-right">{fmt(estimate.casting_fee)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8 border border-neutral-200 p-6">
          <p className="text-[10px] tracking-widest uppercase font-semibold mb-5">Terms & Conditions</p>

          <div className="space-y-5 text-[11px] leading-relaxed text-neutral-600">
            <div>
              <p className="font-semibold text-black mb-1">Scope & Overages</p>
              <p>This estimate is based on the specs shared. Any change in scope, including added shoot days, deliverables, usage, or altered casting criteria — may result in additional fees ("Overages"). Overages will be communicated in writing and require written approval before proceeding.</p>
            </div>

            <div>
              <p className="font-semibold text-black mb-1">Payment Terms</p>
              <ul className="space-y-1 ml-3">
                <li>• Final balance due within 30 days of final invoice.</li>
                <li>• Late payments incur a 2% monthly finance charge.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-black mb-1">Cancellations / Postponements</p>
              <ul className="space-y-1 ml-3">
                <li>• If casting has begun, 50% of the casting fee is due even if the project is canceled.</li>
                <li>• If cancellation occurs within 48 hours of the scheduled casting, 100% of fees and confirmed vendor costs apply.</li>
                <li>• If project is delayed or paused by client beyond the original timeline, additional hold fees may apply.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-black mb-1">Usage & Talent Liability</p>
              <p>Casting Director provides talent options and recommendations in good faith but is not responsible for talent performance or final usage rights negotiated directly with talent agents or production.</p>
            </div>

            <div>
              <p className="font-semibold text-black mb-1">Portfolio Rights</p>
              <p>Casting Director may use non-confidential imagery or footage from the casting session for archival and portfolio purposes unless otherwise agreed in writing.</p>
            </div>
          </div>
        </div>

        {/* Signer info */}
        <div className="space-y-4 mb-8">
          <p className="text-[10px] tracking-widest uppercase font-medium">By signing below, you agree to the Terms & Conditions above</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input value={signerName} onChange={e => setSignerName(e.target.value)} className={inputClass} placeholder="Full name" required />
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} className={inputClass} placeholder="Job title" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input value={signerCompany} onChange={e => setSignerCompany(e.target.value)} className={inputClass} placeholder="Company name" />
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className={labelClass}>Date</label>
          <div className={inputClass + " bg-neutral-50 text-neutral-500"}>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Signature pad */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] tracking-widest uppercase font-medium">Signature</p>
            {hasStrokes && <button onClick={clearSig} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black">Clear</button>}
          </div>
          <canvas
            ref={canvasRef}
            width={600} height={150}
            className="w-full border border-neutral-300 touch-none bg-white cursor-crosshair"
            style={{height: 150}}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
          <p className="text-[10px] text-neutral-400 mt-1">Draw your signature above</p>
        </div>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        <button onClick={submit} disabled={signing} className="w-full py-3 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50">
          {signing ? 'Submitting...' : 'Sign & Submit Estimate'}
        </button>
      </div>
    </main>
  )
}
