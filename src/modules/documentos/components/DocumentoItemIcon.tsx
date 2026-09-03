import { File, Folder } from 'lucide-react'
import { cn } from '@/lib/cn'

type Props = {
  esCarpeta: boolean
  className?: string
}

export function DocumentoItemIcon({ esCarpeta, className }: Props) {
  if (esCarpeta) {
    return (
      <Folder
        className={cn('h-4 w-4 shrink-0 fill-amber-400 text-amber-500', className)}
        aria-hidden
      />
    )
  }

  return (
    <File
      className={cn('h-4 w-4 shrink-0 fill-sky-400/30 text-sky-500', className)}
      aria-hidden
    />
  )
}
