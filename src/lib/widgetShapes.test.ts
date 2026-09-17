import { describe, it, expect } from 'vitest'
import { shapeForWidget } from './widgetShapes'
import { widgetIdForShortcut } from './shortcutWidgets'

describe('shapeForWidget', () => {
  it('gives the search widget a stadium (pill) shape regardless of size', () => {
    expect(shapeForWidget('search', 4, 1)).toBe('stadium')
    expect(shapeForWidget('search', 1, 1)).toBe('stadium')
  })

  it('gives a 1x1 widget a squircle shape', () => {
    expect(shapeForWidget('weather', 1, 1)).toBe('squircle')
    expect(shapeForWidget(widgetIdForShortcut('abc'), 1, 1)).toBe('squircle')
  })

  it('gives a widget larger than 1x1 a rounded rectangle shape', () => {
    expect(shapeForWidget('weather', 2, 2)).toBe('rounded')
    expect(shapeForWidget('weather', 4, 2)).toBe('rounded')
    expect(shapeForWidget(widgetIdForShortcut('abc'), 2, 1)).toBe('rounded')
  })
})
