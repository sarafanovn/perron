import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WeatherWidget } from './WeatherWidget'
import * as weatherApi from '../../lib/weatherApi'
import type { WeatherData } from '../../lib/weatherCache'

function mockWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temperatureC: 19,
    windKph: 5,
    weatherCode: 1,
    locationLabel: '',
    isDay: true,
    humidityPercent: 50,
    feelsLikeC: 18,
    uvIndex: 4,
    hourly: [
      { time: '2026-09-17T10:00', temperatureC: 19, weatherCode: 1 },
      { time: '2026-09-17T11:00', temperatureC: 20, weatherCode: 1 },
      { time: '2026-09-17T12:00', temperatureC: 21, weatherCode: 2 },
    ],
    daily: [
      {
        date: '2026-09-17',
        tempMinC: 14,
        tempMaxC: 22,
        weatherCode: 1,
        sunrise: '2026-09-17T06:43',
        sunset: '2026-09-17T19:16',
      },
      {
        date: '2026-09-18',
        tempMinC: 13,
        tempMaxC: 21,
        weatherCode: 61,
        sunrise: '2026-09-18T06:45',
        sunset: '2026-09-18T19:14',
      },
    ],
    ...overrides,
  }
}

function denyGeolocation() {
  const geolocationMock = {
    getCurrentPosition: (_success: PositionCallback, error?: PositionErrorCallback) => {
      error?.({ code: 1, message: 'denied' } as GeolocationPositionError)
    },
  }
  vi.stubGlobal('navigator', { ...navigator, geolocation: geolocationMock })
}

async function searchAndSelectCity(label: string) {
  const input = await screen.findByPlaceholderText('Search city')
  fireEvent.change(input, { target: { value: label } })
  fireEvent.submit(input.closest('form')!)
  const option = await screen.findByText(label)
  fireEvent.click(option)
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('WeatherWidget', () => {
  it('shows a manual city search when geolocation is denied', async () => {
    denyGeolocation()
    render(<WeatherWidget />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search city')).toBeInTheDocument()
    })
  })

  it('fetches and displays weather for a manually searched city', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData())

    render(<WeatherWidget />)
    await searchAndSelectCity('Paris, France')

    await waitFor(() => {
      expect(document.querySelector('.temp')?.textContent).toBe('19°')
    })
  })

  it('shows only the current conditions at the smallest size', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData())

    const { container } = render(<WeatherWidget colSpan={2} rowSpan={2} />)
    await searchAndSelectCity('Paris, France')

    await waitFor(() => expect(document.querySelector('.temp')?.textContent).toBe('19°'))
    expect(container.querySelector('.weather-hourly')).not.toBeInTheDocument()
    expect(container.querySelector('.weather-daily')).not.toBeInTheDocument()
  })

  it('adds an hourly forecast strip at the medium size', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData())

    const { container } = render(<WeatherWidget colSpan={4} rowSpan={2} />)
    await searchAndSelectCity('Paris, France')

    await waitFor(() => expect(document.querySelector('.temp')?.textContent).toBe('19°'))
    expect(container.querySelector('.weather-hourly')).toBeInTheDocument()
    expect(container.querySelector('.weather-daily')).not.toBeInTheDocument()
  })

  it('adds a daily forecast list at the largest size', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData())

    const { container } = render(<WeatherWidget colSpan={4} rowSpan={4} />)
    await searchAndSelectCity('Paris, France')

    await waitFor(() => expect(document.querySelector('.temp')?.textContent).toBe('19°'))
    expect(container.querySelector('.weather-hourly')).toBeInTheDocument()
    expect(container.querySelector('.weather-daily')).toBeInTheDocument()
  })

  it('adds a details grid (humidity, wind, UV index) only at the largest size', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData({ uvIndex: 7 }))

    const { container, rerender } = render(<WeatherWidget colSpan={2} rowSpan={2} />)
    await searchAndSelectCity('Paris, France')
    await waitFor(() => expect(document.querySelector('.temp')?.textContent).toBe('19°'))
    expect(container.querySelector('.weather-details')).not.toBeInTheDocument()

    rerender(<WeatherWidget colSpan={4} rowSpan={4} />)
    await waitFor(() => expect(container.querySelector('.weather-details')).toBeInTheDocument())
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('5 km/h')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('applies a background gradient derived from the current conditions', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData())

    const { container } = render(<WeatherWidget />)
    await searchAndSelectCity('Paris, France')

    await waitFor(() => {
      const widget = container.querySelector('.weather-widget') as HTMLElement
      expect(widget.style.background).toContain('linear-gradient')
    })
  })

  it('renders as a plain surface with no dynamic gradient when dynamicBackground is false', async () => {
    denyGeolocation()
    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue(mockWeatherData())

    const { container } = render(<WeatherWidget dynamicBackground={false} />)
    await searchAndSelectCity('Paris, France')

    await waitFor(() => {
      const widget = container.querySelector('.weather-widget') as HTMLElement
      expect(widget.classList.contains('weather-widget-static')).toBe(true)
      expect(widget.style.background).toBe('')
    })
  })

})
