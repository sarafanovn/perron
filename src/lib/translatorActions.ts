import { placeWidgetAt } from './gridLayout'
import { widgetIdForTranslator } from './translatorWidgets'
import type { Settings, Translator } from './types'

const DEFAULT_SOURCE_LANG = 'ru'
const DEFAULT_TARGET_LANG = 'en'

/**
 * Creates a ready-to-use translator (default language pair, empty text) at
 * a specific cell — unlike Note/Shortcut, a translator has nothing the user
 * must type before it's usable, so it's placed live rather than as an empty
 * form. No-op if the target cell is already occupied.
 */
export function addTranslatorAt(settings: Settings, col: number, row: number): Settings {
  const newTranslator: Translator = {
    id: crypto.randomUUID(),
    sourceLang: DEFAULT_SOURCE_LANG,
    targetLang: DEFAULT_TARGET_LANG,
    sourceText: '',
    translatedText: '',
  }
  const widgetLayout = placeWidgetAt(
    settings.widgetLayout,
    widgetIdForTranslator(newTranslator.id),
    col,
    row,
    2,
    2,
    settings.grid.columns,
    settings.grid.rows
  )
  if (widgetLayout === settings.widgetLayout) return settings
  return { ...settings, translators: [...settings.translators, newTranslator], widgetLayout }
}

export function removeTranslator(settings: Settings, translatorId: string): Settings {
  const widgetId = widgetIdForTranslator(translatorId)
  return {
    ...settings,
    translators: settings.translators.filter((t) => t.id !== translatorId),
    widgetLayout: settings.widgetLayout.filter((w) => w.widgetId !== widgetId),
  }
}
