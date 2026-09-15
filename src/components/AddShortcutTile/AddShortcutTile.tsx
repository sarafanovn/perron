import { useState, type FormEvent } from 'react'
import './AddShortcutTile.css'

export function AddShortcutTile({
  onAdd,
}: {
  onAdd: (shortcut: { label: string; url: string }) => void
}) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    onAdd({ label: label.trim(), url: url.trim() })
    setLabel('')
    setUrl('')
    setAdding(false)
  }

  if (!adding) {
    return (
      <div className="add-shortcut-tile">
        <button className="open-form-btn" aria-label="Add shortcut" onClick={() => setAdding(true)}>
          +
        </button>
      </div>
    )
  }

  return (
    <div className="add-shortcut-tile">
      <form className="add-form" onSubmit={handleSave}>
        <input aria-label="Label" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input
          aria-label="URL"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">Save</button>
      </form>
    </div>
  )
}
