import type { WidgetId } from './types'

const SHORTCUT_PREFIX = 'shortcut:'

export function widgetIdForShortcut(shortcutId: string): WidgetId {
  return `${SHORTCUT_PREFIX}${shortcutId}`
}

export function isShortcutWidgetId(widgetId: WidgetId): boolean {
  return widgetId.startsWith(SHORTCUT_PREFIX)
}

export function shortcutIdFromWidgetId(widgetId: WidgetId): string {
  return widgetId.slice(SHORTCUT_PREFIX.length)
}
