'use client'

import { DeleteIconButton, EditIconButton } from './IconAction'

interface Props {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
}

export function RowActions({
  onEdit,
  onDelete,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
}: Props) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && <EditIconButton label={editLabel} onClick={onEdit} />}
      {onDelete && <DeleteIconButton label={deleteLabel} onClick={onDelete} />}
    </div>
  )
}
