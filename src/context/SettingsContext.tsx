import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { loadSettings, updateSettings as persistUpdate } from '../lib/storage'
import { BACKGROUND_PRESETS } from '../lib/backgroundPresets'
import type { Settings } from '../lib/types'

interface SettingsContextValue {
  settings: Settings
  update: (patch: (current: Settings) => Settings) => void
  saveError: string | null
  // Transient UI flag (never persisted): true while the user is actively
  // dragging a grid-density slider in SettingsPanel, so WidgetGrid can show
  // its cell-boundary overlay for that too, not just during widget drag.
  isAdjustingGrid: boolean
  setIsAdjustingGrid: (value: boolean) => void
  // Marks the grid as "adjusting" for a short window after any density
  // change (a click on the slider track, a keyboard step), not just while
  // the pointer is physically held down — a track-click resolves in a
  // single press+release pair too fast for the overlay to be seen otherwise.
  pingGridAdjustment: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

// `theme.background.value` for type 'gradient' stores a preset id (see
// DEFAULT_SETTINGS and backgroundPresets.ts); solid and image values are
// already valid CSS (hex / data URL) and need no lookup.
function backgroundCssValue(settings: Settings): string {
  const { type, value } = settings.theme.background
  if (type === 'image') return `url(${value})`
  if (type === 'gradient') {
    const preset = BACKGROUND_PRESETS.find((p) => p.id === value)
    return preset ? preset.css : value
  }
  return value
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isAdjustingGrid, setIsAdjustingGrid] = useState(false)
  const gridPingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function pingGridAdjustment() {
    setIsAdjustingGrid(true)
    if (gridPingTimeout.current) clearTimeout(gridPingTimeout.current)
    gridPingTimeout.current = setTimeout(() => setIsAdjustingGrid(false), 600)
  }

  useEffect(() => {
    return () => {
      if (gridPingTimeout.current) clearTimeout(gridPingTimeout.current)
    }
  }, [])

  const update: SettingsContextValue['update'] = (patch) => {
    const result = persistUpdate(patch)
    setSettings(result.settings)
    setSaveError(result.ok ? null : result.error)
  }

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-accent', settings.theme.accentColor)
    if (settings.theme.font !== 'system') {
      root.style.setProperty('--font-family-base', settings.theme.font)
    }
    root.style.setProperty('--page-background', backgroundCssValue(settings))
  }, [settings])

  return (
    <SettingsContext.Provider
      value={{ settings, update, saveError, isAdjustingGrid, setIsAdjustingGrid, pingGridAdjustment }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
