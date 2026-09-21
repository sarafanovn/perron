import { useRef, useState, type ChangeEvent } from 'react'
import imageCompression from 'browser-image-compression'
import { useSettings } from '../../context/SettingsContext'
import { SEARCH_ENGINES } from '../../lib/searchEngines'
import { BACKGROUND_PRESETS, DEFAULT_ANIMATED_BACKGROUND, parseAnimatedBackground } from '../../lib/backgroundPresets'
import type { AnimatedBackgroundSettings, SearchEngineId, ThemeMode, ThemeStyle } from '../../lib/types'
import './AppearancePanel.css'

// Background images are stored as a base64 data URL directly in the
// settings blob (localStorage), which typically caps out around 5-10MB per
// origin — so instead of rejecting a large upload outright, every image is
// compressed down to fit comfortably under that ceiling (with headroom for
// base64's ~33% size overhead and everything else already in settings).
const MAX_BACKGROUND_IMAGE_MB = 2

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

export function AppearancePanel() {
  const { settings, update, saveError } = useSettings()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

function setFont(value: string) {
    update((current) => ({ ...current, theme: { ...current.theme, font: value } }))
  }

  function setSearchEngine(value: SearchEngineId) {
    update((current) => ({ ...current, search: { engine: value } }))
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setIsCompressing(true)
    let toStore: File | Blob = file
    try {
      // Only touches oversized images — an already-small file is returned
      // essentially as-is, so this doesn't add a quality hit to uploads
      // that never needed compressing in the first place.
      if (file.size > MAX_BACKGROUND_IMAGE_MB * 1024 * 1024) {
        toStore = await imageCompression(file, {
          maxSizeMB: MAX_BACKGROUND_IMAGE_MB,
          maxWidthOrHeight: 2560,
          useWebWorker: true,
        })
      }
    } catch {
      setIsCompressing(false)
      setUploadError("Couldn't process that image. Please try a different file.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setIsCompressing(false)
      update((current) => ({
        ...current,
        theme: { ...current.theme, background: { type: 'image', value: reader.result as string } },
      }))
    }
    reader.onerror = () => {
      setIsCompressing(false)
      setUploadError("Couldn't process that image. Please try a different file.")
    }
    reader.readAsDataURL(toStore)
  }

  return (
    <div className="appearance-panel">
      <div>
        <h3>Appearance</h3>
        <div className="segmented-control" role="group" aria-label="Appearance mode">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={settings.theme.mode === m.id ? 'active' : ''}
              aria-pressed={settings.theme.mode === m.id}
              onClick={() => setThemeMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="segmented-control" role="group" aria-label="Appearance style">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={settings.theme.style === s.id ? 'active' : ''}
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
            aria-label={isCompressing ? 'Compressing image' : 'Choose background image'}
            aria-busy={isCompressing}
            role="button"
            tabIndex={0}
            className={`preset-swatch upload-swatch${isCompressing ? ' compressing' : ''}`}
            onClick={() => !isCompressing && fileInputRef.current?.click()}
          >
            {isCompressing ? <span className="upload-spinner" /> : '+'}
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
              <input
                aria-label="Background base color"
                type="color"
                value={animated.baseColor}
                onChange={(e) => patchAnimatedBackground({ baseColor: e.target.value })}
              />
              <input
                aria-label="Background lowlight color"
                type="color"
                value={animated.lowlightColor}
                onChange={(e) => patchAnimatedBackground({ lowlightColor: e.target.value })}
              />
              <input
                aria-label="Background midtone color"
                type="color"
                value={animated.midtoneColor}
                onChange={(e) => patchAnimatedBackground({ midtoneColor: e.target.value })}
              />
              <input
                aria-label="Background highlight color"
                type="color"
                value={animated.highlightColor}
                onChange={(e) => patchAnimatedBackground({ highlightColor: e.target.value })}
              />
            </div>

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
              Zoom
              <input
                aria-label="Zoom"
                type="range"
                min={0}
                max={100}
                value={animated.zoom}
                onChange={(e) => patchAnimatedBackground({ zoom: Number(e.target.value) })}
              />
            </label>
            <label>
              Blur
              <input
                aria-label="Blur"
                type="range"
                min={0}
                max={100}
                value={animated.blurFactor}
                onChange={(e) => patchAnimatedBackground({ blurFactor: Number(e.target.value) })}
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
