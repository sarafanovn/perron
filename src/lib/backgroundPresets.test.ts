import { describe, it, expect } from 'vitest'
import { DEFAULT_ANIMATED_BACKGROUND, parseAnimatedBackground } from './backgroundPresets'

describe('parseAnimatedBackground', () => {
  it('parses a valid serialized settings object', () => {
    const settings = { colors: ['#111111', '#222222', '#333333'], grain: 10, speed: 20, detail: 30 }
    expect(parseAnimatedBackground(JSON.stringify(settings))).toEqual(settings)
  })

  it('falls back to the default on malformed JSON', () => {
    expect(parseAnimatedBackground('not json')).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when colors has fewer than 2 entries', () => {
    const settings = { colors: ['#111111'], grain: 10, speed: 20, detail: 30 }
    expect(parseAnimatedBackground(JSON.stringify(settings))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when colors has more than 4 entries', () => {
    const settings = {
      colors: ['#111111', '#222222', '#333333', '#444444', '#555555'],
      grain: 10,
      speed: 20,
      detail: 30,
    }
    expect(parseAnimatedBackground(JSON.stringify(settings))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when a numeric field is missing', () => {
    const settings = { colors: ['#111111', '#222222'], grain: 10, speed: 20 }
    expect(parseAnimatedBackground(JSON.stringify(settings))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when colors contains a non-string entry', () => {
    const settings = { colors: ['#111111', 42], grain: 10, speed: 20, detail: 30 }
    expect(parseAnimatedBackground(JSON.stringify(settings))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })
})
