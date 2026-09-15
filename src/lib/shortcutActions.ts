import { findFirstFreeCell } from './gridLayout'
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

export function removeShortcut(settings: Settings, shortcutId: string): Settings {
  const widgetId = widgetIdForShortcut(shortcutId)
  return {
    ...settings,
    shortcuts: settings.shortcuts.filter((s) => s.id !== shortcutId),
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
