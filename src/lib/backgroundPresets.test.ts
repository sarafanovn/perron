import { describe, it, expect } from 'vitest'
import { DEFAULT_ANIMATED_BACKGROUND, parseAnimatedBackground } from './backgroundPresets'

const VALID_SETTINGS = {
  baseColor: '#111111',
  lowlightColor: '#222222',
  midtoneColor: '#333333',
  highlightColor: '#444444',
  speed: 20,
  zoom: 30,
  blurFactor: 50,
}

describe('parseAnimatedBackground', () => {
  it('parses a valid serialized settings object', () => {
    expect(parseAnimatedBackground(JSON.stringify(VALID_SETTINGS))).toEqual(VALID_SETTINGS)
  })

  it('falls back to the default on malformed JSON', () => {
    expect(parseAnimatedBackground('not json')).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when a color field is missing', () => {
    const { baseColor: _baseColor, ...withoutBaseColor } = VALID_SETTINGS
    expect(parseAnimatedBackground(JSON.stringify(withoutBaseColor))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when a color field is not a string', () => {
    const settings = { ...VALID_SETTINGS, baseColor: 42 }
    expect(parseAnimatedBackground(JSON.stringify(settings))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })

  it('falls back to the default when a numeric field is missing', () => {
    const { speed: _speed, ...withoutSpeed } = VALID_SETTINGS
    expect(parseAnimatedBackground(JSON.stringify(withoutSpeed))).toEqual(DEFAULT_ANIMATED_BACKGROUND)
  })
})
