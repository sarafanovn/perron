import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadSettings, updateSettings as persistUpdate } from '../lib/storage'
import { BACKGROUND_PRESETS } from '../lib/backgroundPresets'
import type { Settings } from '../lib/types'

interface SettingsContextValue {
  settings: Settings
  update: (patch: (current: Settings) => Settings) => void
  saveError: string | null
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
    <SettingsContext.Provider value={{ settings, update, saveError }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
