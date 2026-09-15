import { describe, it, expect } from 'vitest'
import { widgetIdForShortcut, isShortcutWidgetId, shortcutIdFromWidgetId } from './shortcutWidgets'

describe('shortcut widget id helpers', () => {
  it('builds a widget id from a shortcut id', () => {
    expect(widgetIdForShortcut('abc-123')).toBe('shortcut:abc-123')
  })

  it('identifies shortcut widget ids', () => {
    expect(isShortcutWidgetId('shortcut:abc-123')).toBe(true)
    expect(isShortcutWidgetId('search')).toBe(false)
    expect(isShortcutWidgetId('weather')).toBe(false)
  })

  it('extracts the shortcut id back out of a widget id', () => {
    expect(shortcutIdFromWidgetId('shortcut:abc-123')).toBe('abc-123')
  })
})
