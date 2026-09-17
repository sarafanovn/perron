import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, updateSettings } from './storage'

const KEY = 'perron:settings:v1'

beforeEach(() => {
  localStorage.clear()
})

describe('loadSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('returns defaults when stored JSON is corrupted', () => {
    localStorage.setItem(KEY, '{not valid json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('returns stored settings when valid', () => {
    const custom = { ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, accentColor: '#ff0000' } }
    localStorage.setItem(KEY, JSON.stringify(custom))
    expect(loadSettings().theme.accentColor).toBe('#ff0000')
  })

  it('defaults theme.mode to auto when settings were saved before it existed', () => {
    const { mode: _mode, ...themeWithoutMode } = DEFAULT_SETTINGS.theme
    const legacy = { ...DEFAULT_SETTINGS, theme: themeWithoutMode }
    localStorage.setItem(KEY, JSON.stringify(legacy))
    expect(loadSettings().theme.mode).toBe('auto')
  })

  it('preserves a valid stored theme.mode', () => {
    const custom = { ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, mode: 'dark' as const } }
    localStorage.setItem(KEY, JSON.stringify(custom))
    expect(loadSettings().theme.mode).toBe('dark')
  })

  it('defaults theme.style to glass when settings were saved before it existed', () => {
    const { style: _style, ...themeWithoutStyle } = DEFAULT_SETTINGS.theme
    const legacy = { ...DEFAULT_SETTINGS, theme: themeWithoutStyle }
    localStorage.setItem(KEY, JSON.stringify(legacy))
    expect(loadSettings().theme.style).toBe('glass')
  })

  it('preserves a valid stored theme.style', () => {
    const custom = { ...DEFAULT_SETTINGS, theme: { ...DEFAULT_SETTINGS.theme, style: 'plain' as const } }
    localStorage.setItem(KEY, JSON.stringify(custom))
    expect(loadSettings().theme.style).toBe('plain')
  })

  it('defaults weather.dynamicBackground to true when settings were saved before it existed', () => {
    const { weather: _weather, ...withoutWeather } = DEFAULT_SETTINGS
    localStorage.setItem(KEY, JSON.stringify(withoutWeather))
    expect(loadSettings().weather.dynamicBackground).toBe(true)
  })

  it('preserves a valid stored weather.dynamicBackground', () => {
    const custom = { ...DEFAULT_SETTINGS, weather: { dynamicBackground: false } }
    localStorage.setItem(KEY, JSON.stringify(custom))
    expect(loadSettings().weather.dynamicBackground).toBe(false)
  })

  it('backfills timeFormat/showDate/showBackground on clocks saved before they existed', () => {
    const legacy = { ...DEFAULT_SETTINGS, clocks: [{ id: 'c1', style: 'digital' }] }
    localStorage.setItem(KEY, JSON.stringify(legacy))
    const clock = loadSettings().clocks[0]
    expect(clock.timeFormat).toBe('24h')
    expect(clock.showDate).toBe(true)
    expect(clock.showBackground).toBe(true)
  })

  it('preserves a valid stored clock customization', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      clocks: [{ id: 'c1', style: 'digital' as const, timeFormat: '12h' as const, showDate: false, showBackground: false }],
    }
    localStorage.setItem(KEY, JSON.stringify(custom))
    const clock = loadSettings().clocks[0]
    expect(clock.timeFormat).toBe('12h')
    expect(clock.showDate).toBe(false)
    expect(clock.showBackground).toBe(false)
  })
})

describe('saveSettings', () => {
  it('persists settings and returns ok', () => {
    const result = saveSettings(DEFAULT_SETTINGS)
    expect(result.ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(DEFAULT_SETTINGS)
  })

  it('returns a failure result when localStorage throws (quota exceeded)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })
    const result = saveSettings(DEFAULT_SETTINGS)
    expect(result.ok).toBe(false)
    spy.mockRestore()
  })
})

describe('updateSettings', () => {
  it('applies a patch function and persists the result', () => {
    const result = updateSettings((current) => ({
      ...current,
      search: { engine: 'duckduckgo' },
    }))
    expect(result.ok).toBe(true)
    expect(result.settings.search.engine).toBe('duckduckgo')
    expect(loadSettings().search.engine).toBe('duckduckgo')
  })

  it('leaves stored settings unchanged when save fails', () => {
    saveSettings(DEFAULT_SETTINGS)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })
    const result = updateSettings((current) => ({
      ...current,
      search: { engine: 'bing' },
    }))
    expect(result.ok).toBe(false)
    spy.mockRestore()
    expect(loadSettings().search.engine).toBe('google')
  })
})
