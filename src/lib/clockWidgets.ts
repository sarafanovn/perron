import type { WidgetId } from './types'

const CLOCK_PREFIX = 'clock:'

export function widgetIdForClock(clockId: string): WidgetId {
  return `${CLOCK_PREFIX}${clockId}`
}

export function isClockWidgetId(widgetId: WidgetId): boolean {
  return widgetId.startsWith(CLOCK_PREFIX)
}

export function clockIdFromWidgetId(widgetId: WidgetId): string {
  return widgetId.slice(CLOCK_PREFIX.length)
}
