export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow'
export type DayPhase = 'sunrise' | 'day' | 'sunset' | 'night'

// WMO weather codes (used by Open-Meteo) grouped into the four broad looks
// the background actually distinguishes. Fog/drizzle read closer to cloudy
// than to rain in a small glanceable widget; thunderstorms are heavy rain.
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
const CLOUDY_CODES = new Set([2, 3, 45, 48])

export function conditionForWeatherCode(weatherCode: number): WeatherCondition {
  if (SNOW_CODES.has(weatherCode)) return 'snow'
  if (RAIN_CODES.has(weatherCode)) return 'rain'
  if (CLOUDY_CODES.has(weatherCode)) return 'cloudy'
  return 'clear'
}

const TWILIGHT_WINDOW_MS = 45 * 60 * 1000

/**
 * Buckets "now" into one of four phases relative to today's sunrise/sunset,
 * matching how the iOS Weather app's background shifts through the day —
 * a ~45min window around each transition reads as sunrise/sunset, and
 * everything else is day or night.
 */
export function dayPhaseAt(now: Date, sunrise: Date, sunset: Date): DayPhase {
  const nowMs = now.getTime()
  const sunriseMs = sunrise.getTime()
  const sunsetMs = sunset.getTime()

  if (Math.abs(nowMs - sunriseMs) <= TWILIGHT_WINDOW_MS) return 'sunrise'
  if (Math.abs(nowMs - sunsetMs) <= TWILIGHT_WINDOW_MS) return 'sunset'
  if (nowMs > sunriseMs && nowMs < sunsetMs) return 'day'
  return 'night'
}

// One hand-picked gradient per (phase, condition) pair — the same approach
// the iOS Weather app uses: a fixed palette keyed by look, not a formula
// blending arbitrary colors, so every combination stays intentional and
// legible with white text.
const GRADIENTS: Record<DayPhase, Record<WeatherCondition, string>> = {
  sunrise: {
    clear: 'linear-gradient(160deg, #ff9a56 0%, #ff6a88 45%, #7b6cf6 100%)',
    cloudy: 'linear-gradient(160deg, #e8967a 0%, #a98caf 50%, #6b7bab 100%)',
    rain: 'linear-gradient(160deg, #8a94a8 0%, #5f6b8a 50%, #414c6b 100%)',
    snow: 'linear-gradient(160deg, #c9d3e0 0%, #a3b3c9 50%, #7f8fab 100%)',
  },
  day: {
    clear: 'linear-gradient(160deg, #4fa6e8 0%, #2f7fd6 55%, #1c5fc0 100%)',
    cloudy: 'linear-gradient(160deg, #8ba3b8 0%, #6d859c 55%, #55697f 100%)',
    rain: 'linear-gradient(160deg, #5c6b7d 0%, #465264 55%, #333c4a 100%)',
    snow: 'linear-gradient(160deg, #a9c4d9 0%, #86a3bd 55%, #6c8aa5 100%)',
  },
  sunset: {
    clear: 'linear-gradient(160deg, #ff8a5c 0%, #e0557a 45%, #5f4b9e 100%)',
    cloudy: 'linear-gradient(160deg, #c97e6e 0%, #93688c 50%, #524a75 100%)',
    rain: 'linear-gradient(160deg, #6e6478 0%, #4c4a63 50%, #32324a 100%)',
    snow: 'linear-gradient(160deg, #b9a8bd 0%, #8f8bab 50%, #6a6c96 100%)',
  },
  night: {
    clear: 'linear-gradient(160deg, #0f2350 0%, #16234a 50%, #05071a 100%)',
    cloudy: 'linear-gradient(160deg, #2b3350 0%, #232a41 50%, #14182a 100%)',
    rain: 'linear-gradient(160deg, #232a3d 0%, #1a1f2e 50%, #0d1019 100%)',
    snow: 'linear-gradient(160deg, #33415c 0%, #29344a 50%, #171e2c 100%)',
  },
}

export function weatherBackground(weatherCode: number, phase: DayPhase): string {
  return GRADIENTS[phase][conditionForWeatherCode(weatherCode)]
}

/** A single glanceable glyph per condition, swapping sun for moon at night. */
export function weatherIcon(weatherCode: number, isDay: boolean): string {
  const condition = conditionForWeatherCode(weatherCode)
  if (condition === 'snow') return '❄️'
  if (condition === 'rain') return '🌧️'
  if (condition === 'cloudy') return '☁️'
  return isDay ? '☀️' : '🌙'
}
