import { describe, it, expect } from 'vitest'
import { swapWidgets, findWidgetAt, findFirstFreeCell } from './gridLayout'
import type { WidgetLayoutEntry } from './types'

const layout: WidgetLayoutEntry[] = [
  { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
  { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
  { widgetId: 'shortcuts', col: 2, row: 1, colSpan: 2, rowSpan: 2 },
]

describe('swapWidgets', () => {
  it('swaps the full position (col/row/colSpan/rowSpan) between two same-sized widgets', () => {
    const result = swapWidgets(layout, 'weather', 'shortcuts')
    const weather = result.find((w) => w.widgetId === 'weather')!
    const shortcuts = result.find((w) => w.widgetId === 'shortcuts')!
    expect(weather.col).toBe(2)
    expect(weather.row).toBe(1)
    expect(weather.colSpan).toBe(2)
    expect(shortcuts.col).toBe(0)
    expect(shortcuts.row).toBe(1)
  })

  it('swaps the full position between differently-sized widgets without leaving overlapping spans', () => {
    const result = swapWidgets(layout, 'search', 'weather')
    const search = result.find((w) => w.widgetId === 'search')!
    const weather = result.find((w) => w.widgetId === 'weather')!
    // search takes weather's old slot entirely, including weather's span
    expect(search.col).toBe(0)
    expect(search.row).toBe(1)
    expect(search.colSpan).toBe(2)
    expect(search.rowSpan).toBe(2)
    // weather takes search's old slot entirely, including search's span
    expect(weather.col).toBe(0)
    expect(weather.row).toBe(0)
    expect(weather.colSpan).toBe(4)
    expect(weather.rowSpan).toBe(1)
  })

  it('returns the same layout when dragging onto itself', () => {
    const result = swapWidgets(layout, 'weather', 'weather')
    expect(result).toEqual(layout)
  })

  it('leaves layout unchanged if either widget id is not found', () => {
    const result = swapWidgets(layout, 'weather', 'nonexistent')
    expect(result).toEqual(layout)
  })
})

describe('findWidgetAt', () => {
  it('finds the widget occupying a given cell', () => {
    expect(findWidgetAt(layout, 0, 0)?.widgetId).toBe('search')
    expect(findWidgetAt(layout, 2, 1)?.widgetId).toBe('shortcuts')
  })

  it('returns undefined for an empty cell', () => {
    expect(findWidgetAt(layout, 3, 3)).toBeUndefined()
  })
})

describe('findFirstFreeCell', () => {
  it('finds the first free cell below the existing widgets', () => {
    // row 0: search spans all 4 columns; rows 1-2: weather + shortcuts
    // (each rowSpan 2) span all 4 columns between them; row 3 is free.
    expect(findFirstFreeCell(layout, 4)).toEqual({ col: 0, row: 3 })
  })

  it('finds a free cell in a partially-filled row', () => {
    const partial: WidgetLayoutEntry[] = [
      { widgetId: 'search', col: 0, row: 0, colSpan: 2, rowSpan: 1 },
    ]
    expect(findFirstFreeCell(partial, 4)).toEqual({ col: 2, row: 0 })
  })

  it('skips cells covered by a multi-cell widget, not just its origin', () => {
    const wide: WidgetLayoutEntry[] = [
      { widgetId: 'weather', col: 0, row: 0, colSpan: 2, rowSpan: 2 },
    ]
    // (1, 1) is inside weather's rectangle even though weather's origin is (0, 0)
    expect(findFirstFreeCell(wide, 4)).toEqual({ col: 2, row: 0 })
  })

  it('returns the first cell when the layout is empty', () => {
    expect(findFirstFreeCell([], 4)).toEqual({ col: 0, row: 0 })
  })
})
