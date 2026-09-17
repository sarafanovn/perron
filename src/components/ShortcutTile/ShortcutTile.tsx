import { faviconUrlFor } from '../../lib/favicon'
import type { Shortcut } from '../../lib/types'
import './ShortcutTile.css'

export function ShortcutTile({
  shortcut,
  editMode = false,
}: {
  shortcut: Shortcut
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
      <img src={shortcut.iconUrl ?? faviconUrlFor(shortcut.url)} alt="" />
      {shortcut.label}
    </a>
  )
}
