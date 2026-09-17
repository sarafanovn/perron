import { describe, it, expect, beforeEach } from 'vitest'
import { readWeatherCache, writeWeatherCache, isWeatherCacheFresh, type WeatherCacheEntry } from './weatherCache'

const entry: WeatherCacheEntry = {
  lat: 52.52,
  lon: 13.405,
  fetchedAt: 1000,
  data: {
    temperatureC: 18,
    windKph: 10,
    weatherCode: 1,
    locationLabel: 'Berlin',
    isDay: true,
    humidityPercent: 60,
    feelsLikeC: 17,
    uvIndex: 4,
    hourly: [{ time: '2026-09-17T10:00', temperatureC: 18, weatherCode: 1 }],
    daily: [
      {
        date: '2026-09-17',
        tempMinC: 12,
        tempMaxC: 20,
        weatherCode: 1,
        sunrise: '2026-09-17T06:43',
        sunset: '2026-09-17T19:16',
      },
    ],
  },
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
    localStorage.setItem('perron:weather-cache:v3', 'not json')
    expect(readWeatherCache()).toBeNull()
  })

  it('treats entries within 10 minutes as fresh', () => {
    expect(isWeatherCacheFresh(entry, entry.fetchedAt + 5 * 60 * 1000)).toBe(true)
  })

  it('treats entries older than 10 minutes as stale', () => {
    expect(isWeatherCacheFresh(entry, entry.fetchedAt + 11 * 60 * 1000)).toBe(false)
  })
})
