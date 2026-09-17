import { placeWidgetAt } from './gridLayout'
import { widgetIdForClock } from './clockWidgets'
import type { Clock, ClockStyle, Settings } from './types'

/**
 * Creates a ready-to-use clock (no fields for the user to fill in, unlike
 * Note/Shortcut) at a specific cell, in the style its picker card chose.
 * No-op if the target rectangle is already occupied.
 */
export function addClockAt(settings: Settings, style: ClockStyle, col: number, row: number): Settings {
  const newClock: Clock = {
    id: crypto.randomUUID(),
    style,
    timeFormat: '24h',
    showDate: true,
    showBackground: true,
  }
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetIdForClock(newClock.id),
    col,
    row,
    2,
    2,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, clocks: [...settings.clocks, newClock], widgetLayout }
}

export function removeClock(settings: Settings, clockId: string): Settings {
  const widgetId = widgetIdForClock(clockId)
  return {
    ...settings,
    clocks: settings.clocks.filter((c) => c.id !== clockId),
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}

const NEXT_CLOCK_STYLE: Record<ClockStyle, ClockStyle> = {
  digital: 'analog',
  analog: 'digital',
}

/** Cycles a clock's style (digital <-> analog) — used when clicking the widget in edit mode. */
export function toggleClockStyle(settings: Settings, clockId: string): Settings {
  return {
    ...settings,
    clocks: settings.clocks.map((c) => (c.id === clockId ? { ...c, style: NEXT_CLOCK_STYLE[c.style] } : c)),
  }
}
