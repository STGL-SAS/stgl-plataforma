'use client'

import { Check, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

type IconActionProps = {
  label: string
  onClick?: () => void
  icon: LucideIcon
  variant?: 'default' | 'danger' | 'primary'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function IconAction({
  label,
  onClick,
  icon: Icon,
  variant = 'default',
  className,
  disabled,
  type = 'button',
}: IconActionProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cmd-focus)]',
        variant === 'danger' &&
          'text-[var(--cmd-decline)] hover:border-[var(--cmd-decline)]/30 hover:bg-[var(--cmd-decline)]/10',
        variant === 'primary' &&
          'text-[var(--cmd-hydrex)] hover:border-[var(--cmd-hydrex)]/30 hover:bg-[var(--cmd-hydrex)]/10',
        variant === 'default' &&
          'text-[var(--cmd-text-muted)] hover:border-[var(--cmd-border)] hover:bg-[var(--cmd-panel-hover)] hover:text-[var(--cmd-text)]',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  )
}

export function DeleteIconButton(
  props: Omit<IconActionProps, 'icon' | 'variant' | 'label'> & { label?: string }
) {
  return <IconAction {...props} label={props.label ?? 'Eliminar'} icon={Trash2} variant="danger" />
}

export function EditIconButton(
  props: Omit<IconActionProps, 'icon' | 'variant' | 'label'> & { label?: string }
) {
  return <IconAction {...props} label={props.label ?? 'Editar'} icon={Pencil} variant="default" />
}

export function SaveIconButton(
  props: Omit<IconActionProps, 'icon' | 'variant' | 'label'> & { label?: string }
) {
  return <IconAction {...props} label={props.label ?? 'Guardar'} icon={Check} variant="primary" />
}

export function AddIconButton(
  props: Omit<IconActionProps, 'icon' | 'variant' | 'label'> & { label?: string }
) {
  return <IconAction {...props} label={props.label ?? 'Agregar'} icon={Plus} variant="primary" />
}
