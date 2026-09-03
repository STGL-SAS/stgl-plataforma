'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { SimpleModal } from '@/components/ui/SimpleModal'
import type { LiveFeedItem } from '@/modules/core/lib/dashboard'
import { commandColors } from '@/styles/command-tokens'
import { cn } from '@/lib/cn'

const FEED_TONE: Record<string, string> = {
  alert: 'var(--cmd-alert)',
  neutral: 'var(--cmd-text-muted)',
  hydrex: commandColors.businesses.HYDREX,
  hangarc: commandColors.businesses.HANGARC,
  virtualwaiter: commandColors.businesses.VIRTUALWAITER,
  hardtech: commandColors.businesses.HARDTECH,
  contabilidad: 'var(--cmd-text-muted)',
}

export function AlertsBellButton({
  count,
  items,
}: {
  count: number
  items: LiveFeedItem[]
}) {
  const [open, setOpen] = useState(false)
  const visibleItems = items.filter((i) => i.id !== 'idle')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count > 0 ? `${count} alertas pendientes` : 'Ver alertas'}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--cmd-border)]',
          'bg-[var(--cmd-panel)] text-[var(--cmd-text-muted)] transition-colors',
          'hover:bg-[var(--cmd-panel-hover)] hover:text-[var(--cmd-text)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cmd-focus)]'
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--cmd-alert)] px-1 text-[10px] font-semibold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <SimpleModal open={open} onClose={() => setOpen(false)} title="Alertas y actividad">
        {visibleItems.length === 0 ? (
          <p className="text-sm text-[var(--cmd-text-muted)]">Sin alertas pendientes.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {visibleItems.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-1.5 hover:bg-[var(--cmd-panel-hover)]"
                    onClick={() => setOpen(false)}
                  >
                    <span style={{ color: FEED_TONE[item.tone] ?? FEED_TONE.neutral }}>
                      {item.text}
                    </span>
                  </Link>
                ) : (
                  <span
                    className="block px-2 py-1.5"
                    style={{ color: FEED_TONE[item.tone] ?? FEED_TONE.neutral }}
                  >
                    {item.text}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SimpleModal>
    </>
  )
}
