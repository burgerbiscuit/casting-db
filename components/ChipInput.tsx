'use client'
import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ChipInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
  onSearch?: (q: string) => void
}

export function ChipInput({ label, value, onChange, placeholder = 'Type and press Enter', suggestions = [], onSearch }: ChipInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const add = (tag?: string) => {
    const t = (tag || input).trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
    setShowSuggestions(false)
  }

  const remove = (tag: string) => onChange(value.filter(t => t !== tag))

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    else if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1])
    else if (e.key === 'Escape') setShowSuggestions(false)
  }

  const handleInput = (val: string) => {
    setInput(val)
    onSearch?.(val)
    setShowSuggestions(val.length > 0)
  }

  const filtered = suggestions.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()))

  return (
    <div ref={ref} className="relative">
      {label && <p className="label mb-2">{label}</p>}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-neutral-100 px-3 py-1 text-xs">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="hover:text-red-500">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => handleInput(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => { if (input) setShowSuggestions(true) }}
        placeholder={placeholder}
        className="w-full border-b border-neutral-300 bg-transparent px-0 py-2 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-20 shadow-sm max-h-48 overflow-y-auto">
          {filtered.slice(0, 10).map(s => (
            <button key={s} type="button" onMouseDown={e => { e.preventDefault(); add(s) }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
