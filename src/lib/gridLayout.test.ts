import { describe, it, expect } from 'vitest'
import {
  moveWidget,
  placeWidgetAt,
  findWidgetAt,
  findFirstFreeCell,
  findFirstFreeSlot,
  reconcileLayout,
  resizeWidget,
} from './gridLayout'
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
})

describe('placeWidgetAt', () => {
  it('inserts a new widget at the given rectangle', () => {
    const result = placeWidgetAt(layout, 'new-widget', 0, 3, 2, 2, COLUMNS, ROWS)
    const entry = result.find((w) => w.widgetId === 'new-widget')
    expect(entry).toMatchObject({ col: 0, row: 3, colSpan: 2, rowSpan: 2 })
  })

  it('leaves existing widgets untouched', () => {
    const result = placeWidgetAt(layout, 'new-widget', 0, 3, 2, 2, COLUMNS, ROWS)
    expect(result.slice(0, layout.length)).toEqual(layout)
  })

  it('rejects a rectangle that overlaps an existing widget', () => {
    const result = placeWidgetAt(layout, 'new-widget', 0, 0, 2, 2, COLUMNS, ROWS)
    expect(result).toEqual(layout)
  })

  it('rejects a rectangle that runs off the grid', () => {
    const result = placeWidgetAt(layout, 'new-widget', 3, 3, 2, 2, COLUMNS, ROWS)
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

describe('findFirstFreeSlot', () => {
  it('finds a slot for a multi-cell widget that fits within bounds', () => {
    expect(findFirstFreeSlot(layout, 2, 2, COLUMNS, ROWS)).toEqual({ col: 0, row: 3 })
  })

  it('returns null when no slot of the requested size fits within bounds', () => {
    expect(findFirstFreeSlot(layout, 5, 1, COLUMNS, ROWS)).toBeNull()
  })

  it('returns the origin when the layout is empty', () => {
    expect(findFirstFreeSlot([], 2, 2, COLUMNS, ROWS)).toEqual({ col: 0, row: 0 })
  })
})

describe('reconcileLayout', () => {
  it('leaves widgets untouched when they still fit within the new bounds', () => {
    const result = reconcileLayout(layout, COLUMNS, ROWS)
    expect(result).toBe(layout)
  })

  it('relocates a widget that now runs off the right edge to the first free slot', () => {
    const shrunkColumns = 3 // shortcuts (col 2, colSpan 2) would run to col 4, past bound 3
    const result = reconcileLayout(layout, shrunkColumns, ROWS)
    const shortcuts = result.find((w) => w.widgetId === 'shortcuts')!
    expect(shortcuts.col + shortcuts.colSpan).toBeLessThanOrEqual(shrunkColumns)
    expect(shortcuts.colSpan).toBe(2)
    expect(shortcuts.rowSpan).toBe(2)
  })

  it('relocates a widget that now runs off the bottom edge, when a free slot exists', () => {
    // A taller grid than the previous test so weather/shortcuts (rowSpan 2)
    // have somewhere to go once they no longer fit at row 1.
    const shrunkRows = 3
    const result = reconcileLayout(layout, COLUMNS, shrunkRows)
    for (const entry of result) {
      expect(entry.row + entry.rowSpan).toBeLessThanOrEqual(shrunkRows)
    }
  })

  it('leaves a 2x2 widget in its out-of-bounds position when no slot fits it', () => {
    // Only 2 rows: a 2x2 widget can never fit anywhere in this grid, so it's
    // left where it was rather than discarded.
    const shrunkRows = 2
    const result = reconcileLayout(layout, COLUMNS, shrunkRows)
    const weather = result.find((w) => w.widgetId === 'weather')!
    expect(weather).toEqual(layout[1])
  })

  it('does not relocate widgets that still fit even if others move', () => {
    const shrunkColumns = 3
    const result = reconcileLayout(layout, shrunkColumns, ROWS)
    const search = result.find((w) => w.widgetId === 'search')
    // search (colSpan 4) no longer fits in 3 columns either, so it also
    // gets relocated — but weather (colSpan 2, col 0) still fits and should
    // be untouched.
    const weather = result.find((w) => w.widgetId === 'weather')!
    expect(weather).toEqual(layout[1])
    expect(search).toBeDefined()
  })

  it('leaves a widget in place if no free slot fits it anywhere', () => {
    const tiny: WidgetLayoutEntry[] = [{ widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 }]
    const result = reconcileLayout(tiny, 2, 8) // 4-wide widget can never fit in a 2-column grid
    expect(result).toEqual(tiny)
  })
})

describe('resizeWidget', () => {
  it('grows a widget into empty space without displacing anyone', () => {
    const sparse: WidgetLayoutEntry[] = [
      { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
    ]
    const result = resizeWidget(sparse, 'search', 4, 2, COLUMNS, ROWS)
    const search = result.find((w) => w.widgetId === 'search')!
    expect(search.colSpan).toBe(4)
    expect(search.rowSpan).toBe(2)
    expect(search.col).toBe(0)
    expect(search.row).toBe(0)
  })

  it('displaces an overlapping widget to the first free slot', () => {
    // shortcut sits directly below weather at col 0-1, row 3-4; growing
    // weather from 2x2 to 2x4 (rows 1-4) now overlaps it.
    const base: WidgetLayoutEntry[] = [
      { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
      { widgetId: 'shortcut:a', col: 0, row: 3, colSpan: 1, rowSpan: 1 },
    ]
    const result = resizeWidget(base, 'weather', 2, 4, COLUMNS, ROWS)
    const weather = result.find((w) => w.widgetId === 'weather')!
    const shortcut = result.find((w) => w.widgetId === 'shortcut:a')!
    expect(weather).toEqual({ widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 4 })
    // no longer overlapping weather's new rectangle
    const overlaps =
      shortcut.col < weather.col + weather.colSpan &&
      shortcut.col + shortcut.colSpan > weather.col &&
      shortcut.row < weather.row + weather.rowSpan &&
      shortcut.row + shortcut.rowSpan > weather.row
    expect(overlaps).toBe(false)
  })

  it('shrinking a widget needs no displacement', () => {
    const result = resizeWidget(layout, 'weather', 1, 1, COLUMNS, ROWS)
    const weather = result.find((w) => w.widgetId === 'weather')!
    expect(weather.colSpan).toBe(1)
    expect(weather.rowSpan).toBe(1)
    const shortcuts = result.find((w) => w.widgetId === 'shortcuts')!
    expect(shortcuts).toEqual(layout[2])
  })

  it('clamps col/row back on-grid when growing would push past the edge', () => {
    const base: WidgetLayoutEntry[] = [
      { widgetId: 'shortcut:a', col: 3, row: 0, colSpan: 1, rowSpan: 1 },
    ]
    const result = resizeWidget(base, 'shortcut:a', 2, 1, COLUMNS, ROWS)
    const shortcut = result.find((w) => w.widgetId === 'shortcut:a')!
    expect(shortcut.col).toBe(2) // clamped so col + colSpan (2) <= COLUMNS (4)
    expect(shortcut.colSpan).toBe(2)
  })

  it('leaves a displaced widget in place if nowhere else fits it', () => {
    // A tightly packed 2-column, 2-row grid: growing 'a' to fill the whole
    // grid leaves 'b' nowhere to go.
    const packed: WidgetLayoutEntry[] = [
      { widgetId: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 1 },
      { widgetId: 'b', col: 1, row: 0, colSpan: 1, rowSpan: 1 },
    ]
    const result = resizeWidget(packed, 'a', 2, 2, 2, 2)
    const b = result.find((w) => w.widgetId === 'b')!
    expect(b).toEqual(packed[1])
  })

  it('returns the same reference when the size does not change', () => {
    const result = resizeWidget(layout, 'weather', 2, 2, COLUMNS, ROWS)
    expect(result).toBe(layout)
  })

  it('returns the layout unchanged for an unknown widget id', () => {
    const result = resizeWidget(layout, 'missing', 2, 2, COLUMNS, ROWS)
    expect(result).toBe(layout)
  })
})
