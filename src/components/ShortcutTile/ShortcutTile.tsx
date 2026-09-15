import { faviconUrlFor } from '../../lib/favicon'
import type { Shortcut } from '../../lib/types'
import './ShortcutTile.css'

export function ShortcutTile({
  shortcut,
  onRemove,
  editMode = false,
}: {
  shortcut: Shortcut
  onRemove: (id: string) => void
  editMode?: boolean
}) {
  return (
    <a
      className={`shortcut-tile${editMode ? ' edit-mode' : ''}`}
      href={shortcut.url}
      draggable={false}
      onClick={(e) => {
        if (editMode) e.preventDefault()
      }}
    >
      {editMode && (
        <span
          className="remove"
          aria-label={`Remove ${shortcut.label}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove(shortcut.id)
          }}
        >
          ✕
        </span>
      )}
      <img src={shortcut.iconUrl ?? faviconUrlFor(shortcut.url)} alt="" />
      {shortcut.label}
    </a>
  )
}
