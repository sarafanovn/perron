import type { WidgetId } from './types'

const NOTE_PREFIX = 'note:'

export function widgetIdForNote(noteId: string): WidgetId {
  return `${NOTE_PREFIX}${noteId}`
}

export function isNoteWidgetId(widgetId: WidgetId): boolean {
  return widgetId.startsWith(NOTE_PREFIX)
}

export function noteIdFromWidgetId(widgetId: WidgetId): string {
  return widgetId.slice(NOTE_PREFIX.length)
}
