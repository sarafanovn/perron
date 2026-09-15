import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WeatherWidget } from './WeatherWidget'
import * as weatherApi from '../../lib/weatherApi'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('WeatherWidget', () => {
  it('shows a manual city search when geolocation is denied', async () => {
    const geolocationMock = {
      getCurrentPosition: (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({ code: 1, message: 'denied' } as GeolocationPositionError)
      },
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: geolocationMock })

    render(<WeatherWidget />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search city')).toBeInTheDocument()
    })
  })

  it('fetches and displays weather for a manually searched city', async () => {
    const geolocationMock = {
      getCurrentPosition: (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({ code: 1, message: 'denied' } as GeolocationPositionError)
      },
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: geolocationMock })

    vi.spyOn(weatherApi, 'geocodeCity').mockResolvedValue([{ label: 'Paris, France', lat: 48.85, lon: 2.35 }])
    vi.spyOn(weatherApi, 'fetchWeatherByCoords').mockResolvedValue({
      temperatureC: 19,
      windKph: 5,
      weatherCode: 1,
      locationLabel: '',
    })

    render(<WeatherWidget />)

    const input = await screen.findByPlaceholderText('Search city')
    fireEvent.change(input, { target: { value: 'Paris' } })
    fireEvent.submit(input.closest('form')!)

    const option = await screen.findByText('Paris, France')
    fireEvent.click(option)

    await waitFor(() => {
      expect(screen.getByText(/19/)).toBeInTheDocument()
    })
  })
})
