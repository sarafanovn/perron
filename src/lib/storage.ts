import type { Settings } from './types'

const STORAGE_KEY = 'perron:settings:v1'

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  theme: {
    accentColor: '#0a84ff',
    background: { type: 'gradient', value: 'sunset' },
    font: 'system',
  },
  search: { engine: 'google' },
  shortcuts: [],
  widgetLayout: [
    { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
    { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
    { widgetId: 'shortcuts', col: 2, row: 1, colSpan: 2, rowSpan: 2 },
  ],
}

function isValidSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && typeof v.theme === 'object' && typeof v.search === 'object'
    && Array.isArray(v.shortcuts) && Array.isArray(v.widgetLayout)
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) return DEFAULT_SETTINGS
    return parsed
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown storage error' }
  }
}

export function updateSettings(
  patch: (current: Settings) => Settings
): { ok: true; settings: Settings } | { ok: false; error: string; settings: Settings } {
  const current = loadSettings()
  const next = patch(current)
  const result = saveSettings(next)
  if (result.ok) {
    return { ok: true, settings: next }
  }
  return { ok: false, error: result.error, settings: current }
}
