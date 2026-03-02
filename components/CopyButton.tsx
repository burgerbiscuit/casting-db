'use client'
import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-xs tracking-widest uppercase text-neutral-400 hover:text-black underline">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
