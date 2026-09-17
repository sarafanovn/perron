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
    mode: 'auto',
    style: 'glass',
  },
  search: { engine: 'google' },
  weather: { dynamicBackground: true },
  shortcuts: [],
  notes: [],
  translators: [],
  clocks: [],
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

// Settings saved before notes/translators/clocks existed lack those arrays
// entirely; backfill them so older localStorage data keeps working.
function migrateWidgetCollections(settings: Settings): Settings {
  const needsNotes = !Array.isArray(settings.notes)
  const needsTranslators = !Array.isArray(settings.translators)
  const needsClocks = !Array.isArray(settings.clocks)
  if (!needsNotes && !needsTranslators && !needsClocks) return settings
  return {
    ...settings,
    notes: needsNotes ? [] : settings.notes,
    translators: needsTranslators ? [] : settings.translators,
    clocks: needsClocks ? [] : settings.clocks,
  }
}

// Settings saved before the Light/Dark/Auto theme mode existed lack
// theme.mode; default to 'auto' so older localStorage data keeps working
// without silently locking existing users into a fixed light appearance.
function migrateThemeMode(settings: Settings): Settings {
  const validModes = ['light', 'dark', 'auto']
  if (validModes.includes(settings.theme.mode)) return settings
  return { ...settings, theme: { ...settings.theme, mode: 'auto' } }
}

// Settings saved before the Plain/Glass style setting existed lack
// theme.style; default to 'glass' so older localStorage data keeps the
// frosted look it already had rather than silently flattening it.
function migrateThemeStyle(settings: Settings): Settings {
  const validStyles = ['plain', 'glass']
  if (validStyles.includes(settings.theme.style)) return settings
  return { ...settings, theme: { ...settings.theme, style: 'glass' } }
}

// Settings saved before the weather widget's dynamic-background toggle
// existed lack `weather`; default to true so older localStorage data keeps
// the gradient look it already had rather than silently flattening it.
function migrateWeatherSettings(settings: Settings): Settings {
  if (settings.weather && typeof settings.weather.dynamicBackground === 'boolean') return settings
  return { ...settings, weather: { dynamicBackground: true } }
}

// Clocks saved before timeFormat/showDate/showBackground existed lack
// those fields; default to the same values addClockAt gives a new clock so
// an existing clock's look doesn't change out from under the user.
function migrateClockSettings(settings: Settings): Settings {
  let changed = false
  const clocks = settings.clocks.map((c) => {
    if (
      typeof c.timeFormat === 'string' &&
      typeof c.showDate === 'boolean' &&
      typeof c.showBackground === 'boolean'
    ) {
      return c
    }
    changed = true
    return {
      ...c,
      timeFormat: c.timeFormat ?? '24h',
      showDate: c.showDate ?? true,
      showBackground: c.showBackground ?? true,
    }
  })
  if (!changed) return settings
  return { ...settings, clocks }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) return DEFAULT_SETTINGS
    return migrateShortcutWidgets(
      migrateClockSettings(
        migrateWeatherSettings(
          migrateThemeStyle(migrateThemeMode(migrateWidgetCollections(migrateGridSettings(parsed))))
        )
      )
    )
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
  if (next === current) {
    return { ok: true, settings: current }
  }
  const result = saveSettings(next)
  if (result.ok) {
    return { ok: true, settings: next }
  }
  return { ok: false, error: result.error, settings: current }
}
