'use client'

import { useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function SimpleModal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:p-4 sm:pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-md rounded-t-xl border border-[var(--cmd-border)] bg-[var(--cmd-panel)] shadow-xl sm:rounded-xl',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--cmd-border)] px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-[var(--cmd-text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-panel-hover)] hover:text-[var(--cmd-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[min(70vh,420px)] overflow-y-auto p-4 sm:max-h-[min(60vh,420px)]">{children}</div>
      </div>
    </div>
  )
}
