const CACHE_KEY = 'perron:weather-cache:v3'
const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000

export interface HourlyForecastPoint {
  time: string
  temperatureC: number
  weatherCode: number
}

export interface DailyForecastPoint {
  date: string
  tempMinC: number
  tempMaxC: number
  weatherCode: number
  sunrise: string
  sunset: string
}

export interface WeatherData {
  temperatureC: number
  windKph: number
  weatherCode: number
  locationLabel: string
  isDay: boolean
  humidityPercent: number
  feelsLikeC: number
  uvIndex: number
  // Next ~24h, one point per hour, starting at the current hour.
  hourly: HourlyForecastPoint[]
  // Today plus the next 6 days.
  daily: DailyForecastPoint[]
}

export interface WeatherCacheEntry {
  lat: number
  lon: number
  fetchedAt: number
  data: WeatherData
}

export function readWeatherCache(): WeatherCacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WeatherCacheEntry
  } catch {
    return null
  }
}

export function writeWeatherCache(entry: WeatherCacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Non-critical cache; ignore write failures.
  }
}

export function isWeatherCacheFresh(
  entry: WeatherCacheEntry,
  now: number,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): boolean {
  return now - entry.fetchedAt < maxAgeMs
}
