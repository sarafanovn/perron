import { faviconUrlFor } from '../../lib/favicon'
import type { Shortcut } from '../../lib/types'
import './ShortcutTile.css'

export function ShortcutTile({
  shortcut,
  onRemove,
}: {
  shortcut: Shortcut
  onRemove: (id: string) => void
}) {
  return (
    <a className="shortcut-tile" href={shortcut.url} draggable={false}>
      <span
        className="remove"
        aria-label={`Remove ${shortcut.label}`}
        onClick={(e) => {
          e.preventDefault()
          onRemove(shortcut.id)
        }}
      >
        ✕
      </span>
      <img src={shortcut.iconUrl ?? faviconUrlFor(shortcut.url)} alt="" />
      {shortcut.label}
    </a>
  )
}
