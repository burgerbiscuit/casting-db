'use client'
import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface ChipInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function ChipInput({ label, value, onChange, placeholder = 'Type and press Enter' }: ChipInputProps) {
  const [input, setInput] = useState('')

  const add = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const remove = (tag: string) => onChange(value.filter(t => t !== tag))

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div>
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
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={placeholder}
        className="w-full border-b border-neutral-300 bg-transparent px-0 py-2 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-400"
      />
    </div>
  )
}
