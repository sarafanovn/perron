import { findFirstFreeCell, placeWidgetAt } from './gridLayout'
import { widgetIdForShortcut } from './shortcutWidgets'
import type { Settings, Shortcut } from './types'

export function addShortcut(settings: Settings, shortcut: Omit<Shortcut, 'id'>): Settings {
  const newShortcut: Shortcut = { ...shortcut, id: crypto.randomUUID() }
  const { col, row } = findFirstFreeCell(settings.widgetLayout, settings.grid.columns)
  return {
    ...settings,
    shortcuts: [...settings.shortcuts, newShortcut],
    widgetLayout: [
      ...settings.widgetLayout,
      { widgetId: widgetIdForShortcut(newShortcut.id), col, row, colSpan: 1, rowSpan: 1 },
    ],
  }
}

/**
 * Creates an empty shortcut (label/url filled in afterward, inline on the
 * grid) at a specific cell — used when a "Shortcut" picker card is dropped
 * onto the grid, macOS-desktop-icon style: the tile appears where dropped,
 * then the user fills in its details in place. No-op if the target cell is
 * already occupied.
 */
export function addShortcutAt(settings: Settings, col: number, row: number): Settings {
  const newShortcut: Shortcut = { id: crypto.randomUUID(), label: '', url: '' }
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetIdForShortcut(newShortcut.id),
    col,
    row,
    1,
    1,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, shortcuts: [...settings.shortcuts, newShortcut], widgetLayout }
}

export function removeShortcut(settings: Settings, shortcutId: string): Settings {
  const widgetId = widgetIdForShortcut(shortcutId)
  return {
    ...settings,
    shortcuts: settings.shortcuts.filter((s) => s.id !== shortcutId),
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
