import { useRef, useState, type ChangeEvent } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { SEARCH_ENGINES } from '../../lib/searchEngines'
import {
  BACKGROUND_PRESETS,
  MAX_BACKGROUND_IMAGE_BYTES,
  DEFAULT_ANIMATED_BACKGROUND,
  parseAnimatedBackground,
} from '../../lib/backgroundPresets'
import type { AnimatedBackgroundSettings, SearchEngineId, ThemeMode, ThemeStyle } from '../../lib/types'
import './AppearancePanel.css'

const FONT_OPTIONS = [
  { id: 'system', label: 'System (SF Pro-like)' },
  { id: 'Georgia, serif', label: 'Serif' },
  { id: "'Courier New', monospace", label: 'Monospace' },
]

const MODE_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'auto', label: 'Auto' },
]

const STYLE_OPTIONS: { id: ThemeStyle; label: string }[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'glass', label: 'Glass' },
]

export function AppearancePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, saveError } = useSettings()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const { background } = settings.theme
  const isAnimated = background.type === 'animated'
  const animated = isAnimated ? parseAnimatedBackground(background.value) : DEFAULT_ANIMATED_BACKGROUND

  function setThemeMode(mode: ThemeMode) {
    update((current) => ({ ...current, theme: { ...current.theme, mode } }))
  }

  function setThemeStyle(style: ThemeStyle) {
    update((current) => ({ ...current, theme: { ...current.theme, style } }))
  }

  function setAccentColor(value: string) {
    update((current) => ({ ...current, theme: { ...current.theme, accentColor: value } }))
  }

  function setPreset(id: string) {
    update((current) => ({
      ...current,
      theme: { ...current.theme, background: { type: 'gradient', value: id } },
    }))
  }

  function setAnimatedBackground() {
    update((current) => ({
      ...current,
      theme: {
        ...current.theme,
        background: { type: 'animated', value: JSON.stringify(DEFAULT_ANIMATED_BACKGROUND) },
      },
    }))
  }

  function patchAnimatedBackground(patch: Partial<AnimatedBackgroundSettings>) {
    update((current) => {
      const existing =
        current.theme.background.type === 'animated'
          ? parseAnimatedBackground(current.theme.background.value)
          : DEFAULT_ANIMATED_BACKGROUND
      const next = { ...existing, ...patch }
      return {
        ...current,
        theme: { ...current.theme, background: { type: 'animated', value: JSON.stringify(next) } },
      }
    })
  }

  function setAnimatedColor(index: number, hex: string) {
    const colors = [...animated.colors]
    colors[index] = hex
    patchAnimatedBackground({ colors })
  }

  function addAnimatedColor() {
    if (animated.colors.length >= 4) return
    patchAnimatedBackground({ colors: [...animated.colors, '#ffffff'] })
  }

  function removeAnimatedColor(index: number) {
    if (animated.colors.length <= 2) return
    patchAnimatedBackground({ colors: animated.colors.filter((_, i) => i !== index) })
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
    <div className="appearance-panel">
      <button className="close-btn" aria-label="Close appearance settings" onClick={onClose}>
        ✕
      </button>

      <div>
        <h3>Appearance</h3>
        <div className="mode-toggle" role="group" aria-label="Appearance mode">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-toggle-btn${settings.theme.mode === m.id ? ' active' : ''}`}
              aria-pressed={settings.theme.mode === m.id}
              onClick={() => setThemeMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mode-toggle" role="group" aria-label="Appearance style">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`mode-toggle-btn${settings.theme.style === s.id ? ' active' : ''}`}
              aria-pressed={settings.theme.style === s.id}
              onClick={() => setThemeStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

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
          <div
            aria-label="Animated"
            aria-pressed={isAnimated}
            role="button"
            tabIndex={0}
            className={`preset-swatch animated-swatch${isAnimated ? ' selected' : ''}`}
            onClick={setAnimatedBackground}
          />
          <div
            aria-label="Choose background image"
            role="button"
            tabIndex={0}
            className="preset-swatch upload-swatch"
            onClick={() => fileInputRef.current?.click()}
          >
            +
          </div>
          <input
            ref={fileInputRef}
            aria-label="Upload background image"
            tabIndex={-1}
            className="upload-input-hidden"
            type="file"
            accept="image/*"
            onChange={handleUpload}
          />
        </div>
        {uploadError && <p role="alert">{uploadError}</p>}

        {isAnimated && (
          <div className="animated-controls">
            <div className="animated-colors">
              {animated.colors.map((hex, i) => (
                <div key={i} className="animated-color-row">
                  <input
                    aria-label={`Animated background color ${i + 1}`}
                    type="color"
                    value={hex}
                    onChange={(e) => setAnimatedColor(i, e.target.value)}
                  />
                  {animated.colors.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remove color ${i + 1}`}
                      className="remove-color-btn"
                      onClick={() => removeAnimatedColor(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {animated.colors.length < 4 && (
                <button type="button" className="add-color-btn" onClick={addAnimatedColor}>
                  + Color
                </button>
              )}
            </div>

            <label>
              Grain
              <input
                aria-label="Grain"
                type="range"
                min={0}
                max={100}
                value={animated.grain}
                onChange={(e) => patchAnimatedBackground({ grain: Number(e.target.value) })}
              />
            </label>
            <label>
              Speed
              <input
                aria-label="Speed"
                type="range"
                min={0}
                max={100}
                value={animated.speed}
                onChange={(e) => patchAnimatedBackground({ speed: Number(e.target.value) })}
              />
            </label>
            <label>
              Detail
              <input
                aria-label="Detail"
                type="range"
                min={0}
                max={100}
                value={animated.detail}
                onChange={(e) => patchAnimatedBackground({ detail: Number(e.target.value) })}
              />
            </label>
          </div>
        )}
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
