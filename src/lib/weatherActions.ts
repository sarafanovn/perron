import { placeWidgetAt } from './gridLayout'
import { widgetIdForWeather } from './weatherWidgets'
import type { Settings } from './types'

/** Adds a new weather widget instance at a specific cell. No-op if the target rectangle doesn't fit. */
export function addWeatherAt(settings: Settings, col: number, row: number): Settings {
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetIdForWeather(crypto.randomUUID()),
    col,
    row,
    2,
    2,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, widgetLayout }
}

export function removeWeather(settings: Settings, widgetId: string): Settings {
  return {
    ...settings,
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
