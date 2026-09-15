import { useState, type ChangeEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { SEARCH_ENGINES } from '../../lib/searchEngines'
import { BACKGROUND_PRESETS, MAX_BACKGROUND_IMAGE_BYTES } from '../../lib/backgroundPresets'
import type { SearchEngineId } from '../../lib/types'
import './SettingsPanel.css'

const FONT_OPTIONS = [
  { id: 'system', label: 'System (SF Pro-like)' },
  { id: 'Georgia, serif', label: 'Serif' },
  { id: "'Courier New', monospace", label: 'Monospace' },
]

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, saveError } = useSettings()
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (!open) return null

  function setAccentColor(value: string) {
    update((current) => ({ ...current, theme: { ...current.theme, accentColor: value } }))
  }

  function setPreset(id: string) {
    update((current) => ({
      ...current,
      theme: { ...current.theme, background: { type: 'gradient', value: id } },
    }))
  }

  function setFont(value: string) {
    update((current) => ({ ...current, theme: { ...current.theme, font: value } }))
  }

  function setSearchEngine(value: SearchEngineId) {
    update((current) => ({ ...current, search: { engine: value } }))
  }

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
      setUploadError('That image is too large. Please choose a smaller file.')
      return
    }
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = () => {
      update((current) => ({
        ...current,
        theme: { ...current.theme, background: { type: 'image', value: reader.result as string } },
      }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="settings-panel">
      <button className="close-btn" aria-label="Close settings" onClick={onClose}>
        ✕
      </button>

      <div>
        <h3>Accent color</h3>
        <input
          aria-label="Accent color"
          type="color"
          value={settings.theme.accentColor}
          onChange={(e) => setAccentColor(e.target.value)}
        />
      </div>

      <div>
        <h3>Background</h3>
        <div className="preset-grid">
          {BACKGROUND_PRESETS.map((p) => (
            <div
              key={p.id}
              aria-label={p.label}
              role="button"
              tabIndex={0}
              className="preset-swatch"
              style={{ background: p.css }}
              onClick={() => setPreset(p.id)}
            />
          ))}
        </div>
        <label>
          Upload background image
          <input aria-label="Upload background image" type="file" accept="image/*" onChange={handleUpload} />
        </label>
        {uploadError && <p role="alert">{uploadError}</p>}
      </div>

      <div>
        <h3>Font</h3>
        <select
          aria-label="Font"
          value={settings.theme.font}
          onChange={(e) => setFont(e.target.value)}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Search engine</h3>
        <select
          aria-label="Search engine"
          value={settings.search.engine}
          onChange={(e) => setSearchEngine(e.target.value as SearchEngineId)}
        >
          {Object.entries(SEARCH_ENGINES).map(([id, def]) => (
            <option key={id} value={id}>
              {def.label}
            </option>
          ))}
        </select>
      </div>

      {saveError && <p role="alert">Couldn't save: {saveError}</p>}
    </div>
  )
}
