import { describe, it, expect, beforeEach } from 'vitest'
import { readWeatherCache, writeWeatherCache, isWeatherCacheFresh, type WeatherCacheEntry } from './weatherCache'

const entry: WeatherCacheEntry = {
  lat: 52.52,
  lon: 13.405,
  fetchedAt: 1000,
  data: { temperatureC: 18, windKph: 10, weatherCode: 1, locationLabel: 'Berlin' },
}

beforeEach(() => {
  localStorage.clear()
})

describe('weather cache', () => {
  it('returns null when nothing cached', () => {
    expect(readWeatherCache()).toBeNull()
  })

  it('round-trips a cache entry', () => {
    writeWeatherCache(entry)
    expect(readWeatherCache()).toEqual(entry)
  })

  it('returns null for corrupted cache data', () => {
    localStorage.setItem('perron:weather-cache:v1', 'not json')
    expect(readWeatherCache()).toBeNull()
  })

  it('treats entries within 10 minutes as fresh', () => {
    expect(isWeatherCacheFresh(entry, entry.fetchedAt + 5 * 60 * 1000)).toBe(true)
  })

  it('treats entries older than 10 minutes as stale', () => {
    expect(isWeatherCacheFresh(entry, entry.fetchedAt + 11 * 60 * 1000)).toBe(false)
  })
})
