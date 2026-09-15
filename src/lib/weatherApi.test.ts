import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWeatherByCoords, geocodeCity } from './weatherApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchWeatherByCoords', () => {
  it('parses Open-Meteo current weather response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: { temperature_2m: 21.4, wind_speed_10m: 12.3, weather_code: 2 },
        }),
      })
    )
    const result = await fetchWeatherByCoords(52.52, 13.405)
    expect(result.temperatureC).toBe(21.4)
    expect(result.windKph).toBe(12.3)
    expect(result.weatherCode).toBe(2)
  })

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchWeatherByCoords(0, 0)).rejects.toThrow()
  })
})

describe('geocodeCity', () => {
  it('parses Open-Meteo geocoding results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'France' }],
        }),
      })
    )
    const results = await geocodeCity('Paris')
    expect(results).toEqual([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
  })

  it('returns an empty array when there are no results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
    expect(await geocodeCity('zzzzz')).toEqual([])
  })
})
