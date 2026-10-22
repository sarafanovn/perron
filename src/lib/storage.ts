import { findFirstFreeCell, resizeWidget } from './gridLayout'
import { closestPreset, sizePresets } from './widgetSizes'
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
function migrateShortcutWidgets(loaded: Settings): Settings {
  // A shortcut dropped onto the grid but never filled in (tab closed with
  // its form still open) is just an empty tile — drop it rather than
  // greeting every new tab with that form again.
  const blank = loaded.shortcuts.filter((s) => !s.label && !s.url).map((s) => widgetIdForShortcut(s.id))
  const settings =
    blank.length === 0
      ? loaded
      : {
          ...loaded,
          shortcuts: loaded.shortcuts.filter((s) => s.label || s.url),
          widgetLayout: loaded.widgetLayout.filter((w) => !blank.includes(w.widgetId)),
        }
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

// A background image is a base64 data URL that can run to several MB, so
// it lives under its own key and the settings blob only holds this marker.
// Otherwise every settings write — one per keystroke in a note or
// translator — would re-serialize and rewrite the whole image too.
const BACKGROUND_IMAGE_KEY = 'perron:background-image:v1'
const BACKGROUND_IMAGE_REF = 'stored:background-image'

// The image value most recently read from or written to
// BACKGROUND_IMAGE_KEY, so saveSettings only rewrites the image when it
// actually changed.
let storedBackgroundImage: string | null = null

function restoreBackgroundImage(settings: Settings): Settings {
  const { background } = settings.theme
  if (background.type !== 'image' || background.value !== BACKGROUND_IMAGE_REF) {
    // Settings saved before the image moved to its own key still carry the
    // data URL inline; the next save moves it out.
    storedBackgroundImage = null
    return settings
  }
  const image = localStorage.getItem(BACKGROUND_IMAGE_KEY)
  storedBackgroundImage = image
  if (!image) return { ...settings, theme: { ...settings.theme, background: DEFAULT_SETTINGS.theme.background } }
  return { ...settings, theme: { ...settings.theme, background: { type: 'image', value: image } } }
}

/** Deletes all saved settings, so the next load starts from DEFAULT_SETTINGS. */
export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(BACKGROUND_IMAGE_KEY)
  } catch {
    // Storage blocked entirely: nothing was saved to clear.
  }
}

/** True for the localStorage keys loadSettings reads — used to pick up changes saved by another tab. */
export function isSettingsStorageKey(key: string | null): boolean {
  return key === STORAGE_KEY || key === BACKGROUND_IMAGE_KEY
}

// A widget saved at a size that is no longer one of its presets (notes used
// to allow 1x1, translators 2x2/2x4) snaps to the closest preset that is,
// moving neighbors aside the same way a manual resize would.
function migrateWidgetSizes(settings: Settings): Settings {
  let layout = settings.widgetLayout
  for (const entry of settings.widgetLayout) {
    const presets = sizePresets(entry.widgetId)
    if (presets.some((p) => p.colSpan === entry.colSpan && p.rowSpan === entry.rowSpan)) continue
    const preset = closestPreset(entry.widgetId, entry.colSpan, entry.rowSpan)
    layout = resizeWidget(layout, entry.widgetId, preset.colSpan, preset.rowSpan, settings.grid.columns, settings.grid.rows)
  }
  return layout === settings.widgetLayout ? settings : { ...settings, widgetLayout: layout }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) return DEFAULT_SETTINGS
    return restoreBackgroundImage(
      migrateWidgetSizes(migrateShortcutWidgets(
        migrateClockSettings(
          migrateWeatherSettings(
            migrateThemeStyle(migrateThemeMode(migrateWidgetCollections(migrateGridSettings(parsed))))
          )
        )
      ))
    )
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): { ok: true } | { ok: false; error: string } {
  try {
    const { background } = settings.theme
    let toStore = settings
    if (background.type === 'image') {
      if (background.value !== storedBackgroundImage) {
        localStorage.setItem(BACKGROUND_IMAGE_KEY, background.value)
        storedBackgroundImage = background.value
      }
      toStore = { ...settings, theme: { ...settings.theme, background: { type: 'image', value: BACKGROUND_IMAGE_REF } } }
    } else if (storedBackgroundImage !== null) {
      localStorage.removeItem(BACKGROUND_IMAGE_KEY)
      storedBackgroundImage = null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown storage error' }
  }
}
