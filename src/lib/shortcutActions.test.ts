import { describe, it, expect } from 'vitest'
import { addShortcut, addShortcutAt, removeShortcut } from './shortcutActions'
import { widgetIdForShortcut } from './shortcutWidgets'
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
  grid: { columns: 4, rows: 8 },
}

describe('addShortcut', () => {
  it('adds the shortcut to settings.shortcuts with a generated id', () => {
    const result = addShortcut(baseSettings, { label: 'GitHub', url: 'https://github.com' })
    expect(result.shortcuts).toHaveLength(1)
    expect(result.shortcuts[0].label).toBe('GitHub')
    expect(result.shortcuts[0].url).toBe('https://github.com')
    expect(result.shortcuts[0].id).toBeTruthy()
  })

  it('adds a matching 1x1 widgetLayout entry in the first free cell', () => {
    const result = addShortcut(baseSettings, { label: 'GitHub', url: 'https://github.com' })
    const shortcutId = result.shortcuts[0].id
    const entry = result.widgetLayout.find((w) => w.widgetId === widgetIdForShortcut(shortcutId))
    expect(entry).toBeDefined()
    expect(entry).toMatchObject({ col: 2, row: 1, colSpan: 1, rowSpan: 1 })
  })

  it('does not mutate the original settings object', () => {
    const original = JSON.parse(JSON.stringify(baseSettings))
    addShortcut(baseSettings, { label: 'GitHub', url: 'https://github.com' })
    expect(baseSettings).toEqual(original)
  })
})

describe('addShortcutAt', () => {
  it('creates an empty shortcut and places it at the given cell', () => {
    const result = addShortcutAt(baseSettings, 2, 3)
    expect(result.shortcuts).toHaveLength(1)
    expect(result.shortcuts[0]).toMatchObject({ label: '', url: '' })
    const entry = result.widgetLayout.find((w) => w.widgetId === widgetIdForShortcut(result.shortcuts[0].id))
    expect(entry).toMatchObject({ col: 2, row: 3, colSpan: 1, rowSpan: 1 })
  })

  it('does not add anything if the target cell is already occupied', () => {
    const result = addShortcutAt(baseSettings, 0, 0)
    expect(result).toBe(baseSettings)
  })
})

describe('removeShortcut', () => {
  it('removes the shortcut and its widgetLayout entry together', () => {
    const withShortcut = addShortcut(baseSettings, { label: 'GitHub', url: 'https://github.com' })
    const shortcutId = withShortcut.shortcuts[0].id
    const result = removeShortcut(withShortcut, shortcutId)
    expect(result.shortcuts).toHaveLength(0)
    expect(result.widgetLayout.find((w) => w.widgetId === widgetIdForShortcut(shortcutId))).toBeUndefined()
  })

  it('leaves other shortcuts and layout entries untouched', () => {
    const withTwo = addShortcut(
      addShortcut(baseSettings, { label: 'GitHub', url: 'https://github.com' }),
      { label: 'YouTube', url: 'https://youtube.com' }
    )
    const [first, second] = withTwo.shortcuts
    const result = removeShortcut(withTwo, first.id)
    expect(result.shortcuts).toEqual([second])
    expect(result.widgetLayout.find((w) => w.widgetId === widgetIdForShortcut(second.id))).toBeDefined()
  })
})
