import { describe, it, expect } from 'vitest'
import { addTranslatorAt, removeTranslator } from './translatorActions'
import { widgetIdForTranslator } from './translatorWidgets'
import type { Settings } from './types'

const baseSettings: Settings = {
  version: 1,
  theme: {
    accentColor: '#0a84ff',
    background: { type: 'gradient', value: 'sunset' },
    font: 'system',
    mode: 'auto',
    style: 'glass',
  },
  search: { engine: 'google' },
  weather: { dynamicBackground: true },
  shortcuts: [],
  notes: [],
  translators: [],
  clocks: [],
  widgetLayout: [
    { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
    { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
  ],
  grid: { columns: 8, rows: 8 },
}

describe('addTranslatorAt', () => {
  it('creates a ready-to-use translator with default languages and places it at the given cell', () => {
    const result = addTranslatorAt(baseSettings, 4, 4)
    expect(result.translators).toHaveLength(1)
    expect(result.translators[0]).toMatchObject({
      sourceLang: 'ru',
      targetLang: 'en',
      sourceText: '',
      translatedText: '',
    })
    const entry = result.widgetLayout.find((w) => w.widgetId === widgetIdForTranslator(result.translators[0].id))
    expect(entry).toMatchObject({ col: 4, row: 4, colSpan: 2, rowSpan: 2 })
  })

  it('does not add anything if the target rectangle overlaps another widget', () => {
    const result = addTranslatorAt(baseSettings, 0, 0)
    expect(result).toBe(baseSettings)
  })
})

describe('removeTranslator', () => {
  it('removes the translator and its widgetLayout entry together', () => {
    const withTranslator = addTranslatorAt(baseSettings, 4, 4)
    const translatorId = withTranslator.translators[0].id
    const result = removeTranslator(withTranslator, translatorId)
    expect(result.translators).toHaveLength(0)
    expect(result.widgetLayout.find((w) => w.widgetId === widgetIdForTranslator(translatorId))).toBeUndefined()
  })
})
