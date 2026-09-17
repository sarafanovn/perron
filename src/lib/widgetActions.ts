import { placeWidgetAt } from './gridLayout'
import type { Settings, WidgetId } from './types'

/**
 * Adds a built-in singleton widget (search, weather) at a specific grid
 * rectangle, e.g. from dragging its picker card onto a cell. No-op if the
 * widget is already placed or the target rectangle doesn't fit.
 */
export function addWidgetAt(
  settings: Settings,
  widgetId: WidgetId,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number
): Settings {
  if (settings.widgetLayout.some((w) => w.widgetId === widgetId)) return settings
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetId,
    col,
    row,
    colSpan,
    rowSpan,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, widgetLayout }
}

/**
 * Removes a built-in singleton widget (search, weather) from the grid so it
 * becomes available again in the widget picker. Shortcuts have their own
 * removeShortcut, which also deletes the underlying Shortcut record.
 */
export function removeWidget(settings: Settings, widgetId: WidgetId): Settings {
  return {
    ...settings,
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
