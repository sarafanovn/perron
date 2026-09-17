import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWeatherByCoords, geocodeCity } from './weatherApi'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockForecastResponse() {
  return {
    current: {
      time: '2026-09-17T10:00',
      temperature_2m: 21.4,
      wind_speed_10m: 12.3,
      weather_code: 2,
      relative_humidity_2m: 55,
      apparent_temperature: 20.1,
      is_day: 1,
      uv_index: 5.2,
    },
    hourly: {
      time: ['2026-09-17T09:00', '2026-09-17T10:00', '2026-09-17T11:00'],
      temperature_2m: [20.0, 21.4, 22.0],
      weather_code: [1, 2, 2],
    },
    daily: {
      time: ['2026-09-17', '2026-09-18'],
      temperature_2m_max: [24.0, 23.0],
      temperature_2m_min: [15.0, 14.0],
      weather_code: [2, 61],
      sunrise: ['2026-09-17T06:43', '2026-09-18T06:45'],
      sunset: ['2026-09-17T19:16', '2026-09-18T19:14'],
    },
  }
}

describe('fetchWeatherByCoords', () => {
  it('parses the current conditions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockForecastResponse() }))
    const result = await fetchWeatherByCoords(52.52, 13.405)
    expect(result.temperatureC).toBe(21.4)
    expect(result.windKph).toBe(12.3)
    expect(result.weatherCode).toBe(2)
    expect(result.isDay).toBe(true)
    expect(result.humidityPercent).toBe(55)
    expect(result.feelsLikeC).toBe(20.1)
    expect(result.uvIndex).toBe(5.2)
  })

  it('defaults uvIndex to 0 when the API omits it', async () => {
    const response = mockForecastResponse()
    delete (response.current as { uv_index?: number }).uv_index
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => response }))
    const result = await fetchWeatherByCoords(52.52, 13.405)
    expect(result.uvIndex).toBe(0)
  })

  it('slices the hourly forecast starting at the current hour', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockForecastResponse() }))
    const result = await fetchWeatherByCoords(52.52, 13.405)
    expect(result.hourly).toEqual([
      { time: '2026-09-17T10:00', temperatureC: 21.4, weatherCode: 2 },
      { time: '2026-09-17T11:00', temperatureC: 22.0, weatherCode: 2 },
    ])
  })

  it('parses the daily forecast including sunrise/sunset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockForecastResponse() }))
    const result = await fetchWeatherByCoords(52.52, 13.405)
    expect(result.daily).toEqual([
      {
        date: '2026-09-17',
        tempMinC: 15.0,
        tempMaxC: 24.0,
        weatherCode: 2,
        sunrise: '2026-09-17T06:43',
        sunset: '2026-09-17T19:16',
      },
      {
        date: '2026-09-18',
        tempMinC: 14.0,
        tempMaxC: 23.0,
        weatherCode: 61,
        sunrise: '2026-09-18T06:45',
        sunset: '2026-09-18T19:14',
      },
    ])
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
