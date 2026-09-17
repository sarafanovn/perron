import { describe, it, expect } from 'vitest'
import { addClockAt, removeClock, toggleClockStyle } from './clockActions'
import { widgetIdForClock } from './clockWidgets'
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

describe('addClockAt', () => {
  it('creates a ready-to-use clock in the given style and places it at the given cell', () => {
    const result = addClockAt(baseSettings, 'digital', 4, 4)
    expect(result.clocks).toHaveLength(1)
    expect(result.clocks[0]).toMatchObject({ style: 'digital' })
    const entry = result.widgetLayout.find((w) => w.widgetId === widgetIdForClock(result.clocks[0].id))
    expect(entry).toMatchObject({ col: 4, row: 4, colSpan: 2, rowSpan: 2 })
  })

  it('creates an analog clock when that style is requested', () => {
    const result = addClockAt(baseSettings, 'analog', 4, 4)
    expect(result.clocks[0]).toMatchObject({ style: 'analog' })
  })

  it('does not add anything if the target rectangle overlaps another widget', () => {
    const result = addClockAt(baseSettings, 'digital', 0, 0)
    expect(result).toBe(baseSettings)
  })
})

describe('removeClock', () => {
  it('removes the clock and its widgetLayout entry together', () => {
    const withClock = addClockAt(baseSettings, 'digital', 4, 4)
    const clockId = withClock.clocks[0].id
    const result = removeClock(withClock, clockId)
    expect(result.clocks).toHaveLength(0)
    expect(result.widgetLayout.find((w) => w.widgetId === widgetIdForClock(clockId))).toBeUndefined()
  })
})

describe('toggleClockStyle', () => {
  it('switches a digital clock to analog', () => {
    const withClock = addClockAt(baseSettings, 'digital', 4, 4)
    const clockId = withClock.clocks[0].id
    const result = toggleClockStyle(withClock, clockId)
    expect(result.clocks[0]).toMatchObject({ style: 'analog' })
  })

  it('switches an analog clock back to digital', () => {
    const withClock = addClockAt(baseSettings, 'analog', 4, 4)
    const clockId = withClock.clocks[0].id
    const result = toggleClockStyle(withClock, clockId)
    expect(result.clocks[0]).toMatchObject({ style: 'digital' })
  })

  it('leaves other clocks untouched', () => {
    const withFirst = addClockAt(baseSettings, 'digital', 4, 4)
    const withBoth = addClockAt(withFirst, 'analog', 6, 4)
    const result = toggleClockStyle(withBoth, withBoth.clocks[0].id)
    expect(result.clocks[1]).toMatchObject({ style: 'analog' })
  })
})
