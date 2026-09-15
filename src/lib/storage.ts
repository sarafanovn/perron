import { findFirstFreeCell } from './gridLayout'
import { widgetIdForShortcut } from './shortcutWidgets'
import type { Settings } from './types'

const STORAGE_KEY = 'perron:settings:v1'
const GRID_COLUMNS = 4

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
  ],
}

function isValidSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && typeof v.theme === 'object' && typeof v.search === 'object'
    && Array.isArray(v.shortcuts) && Array.isArray(v.widgetLayout)
}

// Settings saved before shortcuts became individual grid widgets may carry
// a leftover single 'shortcuts' layout entry and/or be missing a
// widgetLayout entry for shortcuts that already exist in settings.shortcuts.
// Reconcile both on load so the grid never renders an orphaned or
// duplicate-less shortcut.
function migrateShortcutWidgets(settings: Settings): Settings {
  const withoutLegacyEntry = settings.widgetLayout.filter((w) => w.widgetId !== 'shortcuts')
  let layout = withoutLegacyEntry
  for (const shortcut of settings.shortcuts) {
    const widgetId = widgetIdForShortcut(shortcut.id)
    if (layout.some((w) => w.widgetId === widgetId)) continue
    const { col, row } = findFirstFreeCell(layout, GRID_COLUMNS)
    layout = [...layout, { widgetId, col, row, colSpan: 1, rowSpan: 1 }]
  }
  if (layout === settings.widgetLayout) return settings
  return { ...settings, widgetLayout: layout }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) return DEFAULT_SETTINGS
    return migrateShortcutWidgets(parsed)
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
