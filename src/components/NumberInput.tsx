'use client'

import { useState } from 'react'

interface Props {
  value: number | null | undefined
  onChange: (value: number | null) => void
  /** Si true, solo acepta enteros (cantidades, orden, etc.) */
  integer?: boolean
  /** Si true, muestra vacío cuando el valor es 0 */
  emptyWhenZero?: boolean
  className?: string
  placeholder?: string
  id?: string
  required?: boolean
  min?: number
  max?: number
}

function formatDisplay(
  value: number | null | undefined,
  emptyWhenZero: boolean,
  integer: boolean
): string {
  if (value == null || (emptyWhenZero && value === 0)) return ''
  return integer ? String(Math.trunc(value)) : String(value)
}

function parseValue(text: string, integer: boolean): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  if (integer) {
    const digits = trimmed.replace(/\D/g, '')
    if (!digits) return null
    return parseInt(digits, 10)
  }

  const normalized = trimmed.replace(',', '.')
  if (normalized === '.' || normalized === '-') return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function NumberInput({
  value,
  onChange,
  integer = false,
  emptyWhenZero = true,
  className = '',
  placeholder = '—',
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const display = focused ? draft : formatDisplay(value, emptyWhenZero, integer)

  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={display}
      placeholder={placeholder}
      onFocus={(e) => {
        setFocused(true)
        const hasValue = value != null && !(emptyWhenZero && value === 0)
        setDraft(
          hasValue
            ? integer
              ? String(Math.trunc(value))
              : String(value).replace('.', ',')
            : ''
        )
        requestAnimationFrame(() => e.target.select())
      }}
      onBlur={() => {
        setFocused(false)
        setDraft('')
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        onChange(parseValue(raw, integer))
      }}
      className={`rounded-md border border-zinc-300 px-3 py-2 tabular-nums ${className}`}
      {...rest}
    />
  )
}
