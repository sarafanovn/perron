import { describe, it, expect } from 'vitest'
import { moveWidget, findWidgetAt, findFirstFreeCell } from './gridLayout'
import type { WidgetLayoutEntry } from './types'

const layout: WidgetLayoutEntry[] = [
  { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
  { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
  { widgetId: 'shortcuts', col: 2, row: 1, colSpan: 2, rowSpan: 2 },
]
const COLUMNS = 4
const ROWS = 8

describe('moveWidget', () => {
  it('moves a widget to a free cell, keeping its own span', () => {
    const result = moveWidget(layout, 'weather', 0, 3, COLUMNS, ROWS)
    const weather = result.find((w) => w.widgetId === 'weather')!
    expect(weather.col).toBe(0)
    expect(weather.row).toBe(3)
    expect(weather.colSpan).toBe(2)
    expect(weather.rowSpan).toBe(2)
  })

  it('does not move other widgets', () => {
    const result = moveWidget(layout, 'weather', 0, 3, COLUMNS, ROWS)
    const search = result.find((w) => w.widgetId === 'search')!
    const shortcuts = result.find((w) => w.widgetId === 'shortcuts')!
    expect(search).toEqual(layout[0])
    expect(shortcuts).toEqual(layout[2])
  })

  it('rejects a move onto a cell occupied by another widget', () => {
    const result = moveWidget(layout, 'weather', 2, 1, COLUMNS, ROWS)
    expect(result).toEqual(layout)
  })

  it('rejects a move that would run past the right edge of the grid', () => {
    const result = moveWidget(layout, 'weather', 3, 3, COLUMNS, ROWS)
    expect(result).toEqual(layout)
  })

  it('rejects a move that would run past the bottom edge of the grid', () => {
    const result = moveWidget(layout, 'weather', 0, 7, COLUMNS, ROWS)
    expect(result).toEqual(layout)
  })

  it('rejects a negative target position', () => {
    const result = moveWidget(layout, 'weather', -1, 1, COLUMNS, ROWS)
    expect(result).toEqual(layout)
  })

  it('returns the same layout when dropped on its own current cell', () => {
    const result = moveWidget(layout, 'weather', 0, 1, COLUMNS, ROWS)
    expect(result).toEqual(layout)
  })

  it('leaves the layout unchanged if the widget id is not found', () => {
    const result = moveWidget(layout, 'nonexistent', 0, 3, COLUMNS, ROWS)
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
