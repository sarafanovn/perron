import { placeWidgetAt } from './gridLayout'
import { widgetIdForSearch } from './searchWidgets'
import type { Settings } from './types'

/** Adds a new search widget instance at a specific cell. No-op if the target rectangle doesn't fit. */
export function addSearchAt(settings: Settings, col: number, row: number): Settings {
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetIdForSearch(crypto.randomUUID()),
    col,
    row,
    4,
    1,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, widgetLayout }
}

export function removeSearch(settings: Settings, widgetId: string): Settings {
  return {
    ...settings,
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
