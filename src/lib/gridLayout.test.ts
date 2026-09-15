import { describe, it, expect } from 'vitest'
import { swapWidgets, findWidgetAt } from './gridLayout'
import type { WidgetLayoutEntry } from './types'

const layout: WidgetLayoutEntry[] = [
  { widgetId: 'search', col: 0, row: 0, colSpan: 4, rowSpan: 1 },
  { widgetId: 'weather', col: 0, row: 1, colSpan: 2, rowSpan: 2 },
  { widgetId: 'shortcuts', col: 2, row: 1, colSpan: 2, rowSpan: 2 },
]

describe('swapWidgets', () => {
  it('swaps col/row between two widgets, keeping their own spans', () => {
    const result = swapWidgets(layout, 'weather', 'shortcuts')
    const weather = result.find((w) => w.widgetId === 'weather')!
    const shortcuts = result.find((w) => w.widgetId === 'shortcuts')!
    expect(weather.col).toBe(2)
    expect(weather.row).toBe(1)
    expect(weather.colSpan).toBe(2)
    expect(shortcuts.col).toBe(0)
    expect(shortcuts.row).toBe(1)
  })

  it('returns the same layout when dragging onto itself', () => {
    const result = swapWidgets(layout, 'weather', 'weather')
    expect(result).toEqual(layout)
  })

  it('leaves layout unchanged if either widget id is not found', () => {
    // @ts-expect-error testing invalid id defensively
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
