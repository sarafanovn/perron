import { describe, it, expect } from 'vitest'
import { sizePresets, closestPreset } from './widgetSizes'
import { widgetIdForShortcut } from './shortcutWidgets'

describe('sizePresets', () => {
  it('gives shortcuts a 1x1 and 2x1 preset', () => {
    expect(sizePresets(widgetIdForShortcut('abc'))).toEqual([
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
    ])
  })

  it('gives weather a 2x2 and 4x2 preset', () => {
    expect(sizePresets('weather')).toEqual([
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 4, rowSpan: 2 },
    ])
  })

  it('gives search a single 4x1 preset, meaning it is not resizable', () => {
    expect(sizePresets('search')).toEqual([{ colSpan: 4, rowSpan: 1 }])
  })
})

describe('closestPreset', () => {
  it('picks the nearer preset when the trial size sits between two', () => {
    expect(closestPreset(widgetIdForShortcut('abc'), 2, 1)).toEqual({ colSpan: 2, rowSpan: 1 })
    expect(closestPreset(widgetIdForShortcut('abc'), 1, 1)).toEqual({ colSpan: 1, rowSpan: 1 })
  })

  it('snaps a mid-drag trial size to the closest weather preset', () => {
    expect(closestPreset('weather', 3, 2)).toEqual({ colSpan: 2, rowSpan: 2 })
    expect(closestPreset('weather', 4, 2)).toEqual({ colSpan: 4, rowSpan: 2 })
  })

  it('always returns the single preset for a non-resizable widget', () => {
    expect(closestPreset('search', 1, 1)).toEqual({ colSpan: 4, rowSpan: 1 })
  })
})
