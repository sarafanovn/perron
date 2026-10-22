import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { labelFromUrl } from '../../lib/shortcutLabel'
import { normalizeShortcutUrl } from '../../lib/shortcutUrl'
import { Icon } from '../Icon/Icon'
import './AddShortcutTile.css'

const POPOVER_WIDTH_PX = 240
const POPOVER_GAP_PX = 8

/**
 * Stands in for a shortcut tile that was just dropped onto the grid
 * (macOS-desktop-icon style: the tile appears where dropped, empty, then
 * gets filled in). The tile itself only shows a placeholder; the label+URL
 * form opens in a popover beside it — a 1x1 cell is ~60px square, far too
 * small to hold two inputs and two buttons, which is where the form used
 * to be squeezed. The popover is portaled to <body> so neither the tile's
 * squircle clip nor the grid's edit-mode transform clip or shrink it.
 * Cancelling removes the still-unconfigured shortcut rather than leaving a
 * blank tile.
 *
 * Label auto-fills from the URL's hostname as the user types it, like a
 * browser bookmark's suggested title — but only until the user edits the
 * label field themselves, after which their own text is never overwritten.
 */
export function AddShortcutTile({
  onSave,
  onCancel,
}: {
  onSave: (shortcut: { label: string; url: string }) => void
  onCancel: () => void
}) {
  const tileRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [labelEditedByUser, setLabelEditedByUser] = useState(false)

  useLayoutEffect(() => {
    function place() {
      const rect = tileRef.current?.getBoundingClientRect()
      if (!rect) return
      // Prefer the right of the tile; flip to its left near the viewport's
      // right edge, and keep the popover vertically on-screen.
      const fitsRight = rect.right + POPOVER_GAP_PX + POPOVER_WIDTH_PX <= window.innerWidth
      const left = fitsRight
        ? rect.right + POPOVER_GAP_PX
        : Math.max(POPOVER_GAP_PX, rect.left - POPOVER_GAP_PX - POPOVER_WIDTH_PX)
      const top = Math.max(POPOVER_GAP_PX, Math.min(rect.top, window.innerHeight - 200))
      setPosition({ left, top })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [])

  function handleUrlChange(value: string) {
    setUrl(value)
    if (!labelEditedByUser) {
      setLabel(labelFromUrl(value))
    }
  }

  function handleLabelChange(value: string) {
    setLabelEditedByUser(true)
    setLabel(value)
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    onSave({ label: label.trim(), url: normalizeShortcutUrl(url) })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="add-shortcut-tile" ref={tileRef}>
      <Icon name="plus" size={18} />
      {position &&
        createPortal(
          <form
            className="add-shortcut-popover"
            style={{ left: position.left, top: position.top, width: POPOVER_WIDTH_PX }}
            onSubmit={handleSave}
            onKeyDown={handleKeyDown}
          >
            <h4>New shortcut</h4>
            <input
              aria-label="URL"
              placeholder="github.com"
              autoFocus
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            <input
              aria-label="Label"
              placeholder="Label"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
            />
            <div className="add-form-actions">
              <button type="button" className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" disabled={!label.trim() || !url.trim()}>
                Save
              </button>
            </div>
          </form>,
          document.body
        )}
    </div>
  )
}
