import { describe, it, expect } from 'vitest'
import { conditionForWeatherCode, dayPhaseAt, weatherBackground, weatherIcon } from './weatherBackground'

describe('conditionForWeatherCode', () => {
  it('classifies clear-sky codes as clear', () => {
    expect(conditionForWeatherCode(0)).toBe('clear')
    expect(conditionForWeatherCode(1)).toBe('clear')
  })

  it('classifies overcast/fog codes as cloudy', () => {
    expect(conditionForWeatherCode(2)).toBe('cloudy')
    expect(conditionForWeatherCode(3)).toBe('cloudy')
    expect(conditionForWeatherCode(45)).toBe('cloudy')
  })

  it('classifies rain/drizzle/thunderstorm codes as rain', () => {
    expect(conditionForWeatherCode(61)).toBe('rain')
    expect(conditionForWeatherCode(51)).toBe('rain')
    expect(conditionForWeatherCode(95)).toBe('rain')
  })

  it('classifies snow codes as snow', () => {
    expect(conditionForWeatherCode(71)).toBe('snow')
    expect(conditionForWeatherCode(85)).toBe('snow')
  })
})

describe('dayPhaseAt', () => {
  const sunrise = new Date('2026-06-15T06:00:00')
  const sunset = new Date('2026-06-15T20:00:00')

  it('returns day for a time well after sunrise and before sunset', () => {
    expect(dayPhaseAt(new Date('2026-06-15T12:00:00'), sunrise, sunset)).toBe('day')
  })

  it('returns night for a time well before sunrise', () => {
    expect(dayPhaseAt(new Date('2026-06-15T02:00:00'), sunrise, sunset)).toBe('night')
  })

  it('returns night for a time well after sunset', () => {
    expect(dayPhaseAt(new Date('2026-06-15T23:00:00'), sunrise, sunset)).toBe('night')
  })

  it('returns sunrise within the twilight window around sunrise', () => {
    expect(dayPhaseAt(new Date('2026-06-15T06:10:00'), sunrise, sunset)).toBe('sunrise')
    expect(dayPhaseAt(new Date('2026-06-15T05:50:00'), sunrise, sunset)).toBe('sunrise')
  })

  it('returns sunset within the twilight window around sunset', () => {
    expect(dayPhaseAt(new Date('2026-06-15T20:10:00'), sunrise, sunset)).toBe('sunset')
    expect(dayPhaseAt(new Date('2026-06-15T19:50:00'), sunrise, sunset)).toBe('sunset')
  })
})

describe('weatherBackground', () => {
  it('returns a distinct gradient for every phase/condition combination', () => {
    const phases = ['sunrise', 'day', 'sunset', 'night'] as const
    const codes = [0, 3, 61, 71]
    const seen = new Set<string>()
    for (const phase of phases) {
      for (const code of codes) {
        seen.add(weatherBackground(code, phase))
      }
    }
    expect(seen.size).toBe(phases.length * codes.length)
  })

  it('returns a valid CSS gradient string', () => {
    expect(weatherBackground(0, 'day')).toMatch(/^linear-gradient\(/)
  })
})

describe('weatherIcon', () => {
  it('shows a sun for clear weather during the day', () => {
    expect(weatherIcon(0, true)).toBe('☀️')
  })

  it('shows a moon for clear weather at night', () => {
    expect(weatherIcon(0, false)).toBe('🌙')
  })

  it('shows the same cloud icon for cloudy weather regardless of day/night', () => {
    expect(weatherIcon(3, true)).toBe('☁️')
    expect(weatherIcon(3, false)).toBe('☁️')
  })

  it('shows a rain icon for rain codes', () => {
    expect(weatherIcon(61, true)).toBe('🌧️')
  })

  it('shows a snow icon for snow codes', () => {
    expect(weatherIcon(71, true)).toBe('❄️')
  })
})
