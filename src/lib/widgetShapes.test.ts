import { describe, it, expect } from 'vitest'
import { shapeForWidget } from './widgetShapes'
import { widgetIdForShortcut } from './shortcutWidgets'

describe('shapeForWidget', () => {
  it('gives the search widget a stadium (pill) shape', () => {
    expect(shapeForWidget('search')).toBe('stadium')
  })

  it('gives the weather widget a squircle shape', () => {
    expect(shapeForWidget('weather')).toBe('squircle')
  })

  it('gives shortcut widgets a squircle shape', () => {
    expect(shapeForWidget(widgetIdForShortcut('abc'))).toBe('squircle')
  })
})
