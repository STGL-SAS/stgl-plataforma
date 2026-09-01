'use client'

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
    <div className="flex items-center gap-2">
      {onEdit && (
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
          onClick={onEdit}
        >
          {editLabel}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="text-xs font-medium text-red-600 hover:text-red-800"
          onClick={onDelete}
        >
          {deleteLabel}
        </button>
      )}
    </div>
  )
}
