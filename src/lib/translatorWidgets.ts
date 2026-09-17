import type { WidgetId } from './types'

const TRANSLATOR_PREFIX = 'translator:'

export function widgetIdForTranslator(translatorId: string): WidgetId {
  return `${TRANSLATOR_PREFIX}${translatorId}`
}

export function isTranslatorWidgetId(widgetId: WidgetId): boolean {
  return widgetId.startsWith(TRANSLATOR_PREFIX)
}

export function translatorIdFromWidgetId(widgetId: WidgetId): string {
  return widgetId.slice(TRANSLATOR_PREFIX.length)
}
