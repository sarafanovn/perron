import type { WidgetId } from './types'

const SEARCH_PREFIX = 'search:'

export function widgetIdForSearch(searchId: string): WidgetId {
  return `${SEARCH_PREFIX}${searchId}`
}

export function isSearchWidgetId(widgetId: WidgetId): boolean {
  return widgetId === 'search' || widgetId.startsWith(SEARCH_PREFIX)
}
