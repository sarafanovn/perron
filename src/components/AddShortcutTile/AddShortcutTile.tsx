import { useState, type FormEvent } from 'react'
import { labelFromUrl } from '../../lib/shortcutLabel'
import './AddShortcutTile.css'

/**
 * The inline label+URL form shown in place of a shortcut tile that was just
 * dropped onto the grid from the widget picker (macOS-desktop-icon style:
 * the tile appears where dropped, empty, then gets filled in). Cancelling
 * removes the still-unconfigured shortcut rather than leaving a blank tile.
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
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [labelEditedByUser, setLabelEditedByUser] = useState(false)

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
    onSave({ label: label.trim(), url: url.trim() })
  }

  return (
    <div className="add-shortcut-tile">
      <form className="add-form" onSubmit={handleSave}>
        <input
          aria-label="URL"
          placeholder="https://example.com"
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
          <button type="button" className="cancel-btn" aria-label="Cancel adding shortcut" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  )
}
