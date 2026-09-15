const CACHE_KEY = 'perron:weather-cache:v1'
const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000

export interface WeatherData {
  temperatureC: number
  windKph: number
  weatherCode: number
  locationLabel: string
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
