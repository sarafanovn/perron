import { findFirstFreeCell } from './gridLayout'
import { widgetIdForShortcut } from './shortcutWidgets'
import type { Settings } from './types'

const STORAGE_KEY = 'perron:settings:v1'

export const DEFAULT_GRID: Settings['grid'] = { columns: 12, rows: 8 }

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
  grid: DEFAULT_GRID,
}

function isValidSettings(value: unknown): value is Omit<Settings, 'grid'> & { grid?: unknown } {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && typeof v.theme === 'object' && typeof v.search === 'object'
    && Array.isArray(v.shortcuts) && Array.isArray(v.widgetLayout)
}

function isValidGrid(value: unknown): value is Settings['grid'] {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.columns === 'number' && typeof v.rows === 'number'
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
    const { col, row } = findFirstFreeCell(layout, settings.grid.columns)
    layout = [...layout, { widgetId, col, row, colSpan: 1, rowSpan: 1 }]
  }
  if (layout === settings.widgetLayout) return settings
  return { ...settings, widgetLayout: layout }
}

// Settings saved before adjustable grid density was added lack a `grid`
// field entirely; backfill the default so older localStorage data keeps
// working instead of being discarded wholesale.
function migrateGridSettings(settings: Omit<Settings, 'grid'> & { grid?: unknown }): Settings {
  if (isValidGrid(settings.grid)) return settings as Settings
  return { ...settings, grid: DEFAULT_GRID } as Settings
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) return DEFAULT_SETTINGS
    return migrateShortcutWidgets(migrateGridSettings(parsed))
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
