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
