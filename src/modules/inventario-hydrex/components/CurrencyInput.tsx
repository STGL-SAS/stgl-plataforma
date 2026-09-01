'use client'

import { useState } from 'react'
import { formatCOPInput } from '../lib/currency-input'

interface Props {
  value: number | null | undefined
  onChange: (value: number | null) => void
  className?: string
  placeholder?: string
  id?: string
  required?: boolean
  /** Si true, campo vacío envía null; si false, envía 0 */
  nullable?: boolean
}

export function CurrencyInput({
  value,
  onChange,
  className = '',
  placeholder = '—',
  nullable = true,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const display = focused
    ? draft
    : formatCOPInput(value, { emptyWhenZero: nullable })

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      placeholder={placeholder}
      onFocus={(e) => {
        setFocused(true)
        const hasValue = value != null && !(nullable && value === 0)
        setDraft(hasValue ? String(Math.trunc(value)) : '')
        requestAnimationFrame(() => e.target.select())
      }}
      onBlur={() => {
        setFocused(false)
        setDraft('')
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '')
        setDraft(digits)
        if (!digits) {
          onChange(nullable ? null : 0)
          return
        }
        onChange(Number(digits))
      }}
      className={`rounded-md border border-zinc-300 px-3 py-2 tabular-nums ${className}`}
      {...rest}
    />
  )
}
