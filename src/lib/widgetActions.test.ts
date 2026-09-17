import { describe, it, expect } from 'vitest'
import { addWidgetAt, removeWidget } from './widgetActions'
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
  widgetLayout: [{ widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 }],
  grid: { columns: 8, rows: 8 },
}

describe('addWidgetAt', () => {
  it('adds a singleton widget at the given rectangle', () => {
    const result = addWidgetAt(baseSettings, 'weather', 0, 2, 2, 2)
    const entry = result.widgetLayout.find((w) => w.widgetId === 'weather')
    expect(entry).toMatchObject({ col: 0, row: 2, colSpan: 2, rowSpan: 2 })
  })

  it('is a no-op if the widget is already placed', () => {
    const withWeather = addWidgetAt(baseSettings, 'weather', 0, 2, 2, 2)
    const result = addWidgetAt(withWeather, 'weather', 4, 4, 2, 2)
    expect(result).toBe(withWeather)
  })

  it('is a no-op if the target rectangle overlaps another widget', () => {
    const result = addWidgetAt(baseSettings, 'weather', 0, 0, 2, 2)
    expect(result).toBe(baseSettings)
  })
})

describe('removeWidget', () => {
  it('removes the widget from the layout', () => {
    const withWeather = addWidgetAt(baseSettings, 'weather', 0, 2, 2, 2)
    const result = removeWidget(withWeather, 'weather')
    expect(result.widgetLayout.some((w) => w.widgetId === 'weather')).toBe(false)
  })

  it('leaves other widgets untouched', () => {
    const withWeather = addWidgetAt(baseSettings, 'weather', 0, 2, 2, 2)
    const result = removeWidget(withWeather, 'weather')
    expect(result.widgetLayout.some((w) => w.widgetId === 'search')).toBe(true)
  })
})
