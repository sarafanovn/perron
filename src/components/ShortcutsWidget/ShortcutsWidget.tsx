import { useState, type FormEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { faviconUrlFor } from '../../lib/favicon'
import type { Shortcut } from '../../lib/types'
import './ShortcutsWidget.css'

export function ShortcutsWidget() {
  const { settings, update } = useSettings()
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    const shortcut: Shortcut = {
      id: crypto.randomUUID(),
      label: label.trim(),
      url: url.trim(),
    }
    update((current) => ({ ...current, shortcuts: [...current.shortcuts, shortcut] }))
    setLabel('')
    setUrl('')
    setAdding(false)
  }

  function handleRemove(id: string) {
    update((current) => ({ ...current, shortcuts: current.shortcuts.filter((s) => s.id !== id) }))
  }

  return (
    <div className="shortcuts-widget">
      {settings.shortcuts.map((s) => (
        <a key={s.id} className="tile" href={s.url}>
          <span className="remove" aria-label={`Remove ${s.label}`} onClick={(e) => { e.preventDefault(); handleRemove(s.id) }}>
            ✕
          </span>
          <img src={s.iconUrl ?? faviconUrlFor(s.url)} alt="" />
          {s.label}
        </a>
      ))}
      {adding ? (
        <form className="add-form" onSubmit={handleSave}>
          <input aria-label="Label" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input aria-label="URL" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit">Save</button>
        </form>
      ) : (
        <button aria-label="Add shortcut" onClick={() => setAdding(true)}>
          +
        </button>
      )}
    </div>
  )
}
