import type { WeatherData } from './weatherCache'

const HOURLY_POINTS = 24
const DAILY_POINTS = 7

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m,apparent_temperature,is_day,uv_index` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset` +
    `&forecast_days=${DAILY_POINTS}&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather request failed: ${res.status}`)
  const json = await res.json()

  // hourly.time is a flat array covering all forecast_days from local
  // midnight; slice from "now" (the first index at or after current.time)
  // so the strip always starts at the current hour, not the start of today.
  const hourlyTimes: string[] = json.hourly.time
  const startIndex = Math.max(
    0,
    hourlyTimes.findIndex((t) => t >= json.current.time)
  )

  return {
    temperatureC: json.current.temperature_2m,
    windKph: json.current.wind_speed_10m,
    weatherCode: json.current.weather_code,
    locationLabel: '',
    isDay: json.current.is_day === 1,
    humidityPercent: json.current.relative_humidity_2m,
    feelsLikeC: json.current.apparent_temperature,
    uvIndex: json.current.uv_index ?? 0,
    hourly: hourlyTimes.slice(startIndex, startIndex + HOURLY_POINTS).map((time, i) => ({
      time,
      temperatureC: json.hourly.temperature_2m[startIndex + i],
      weatherCode: json.hourly.weather_code[startIndex + i],
    })),
    daily: (json.daily.time as string[]).map((date, i) => ({
      date,
      tempMinC: json.daily.temperature_2m_min[i],
      tempMaxC: json.daily.temperature_2m_max[i],
      weatherCode: json.daily.weather_code[i],
      sunrise: json.daily.sunrise[i],
      sunset: json.daily.sunset[i],
    })),
  }
}

export async function geocodeCity(
  name: string
): Promise<Array<{ label: string; lat: number; lon: number }>> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`)
  const json = await res.json()
  if (!json.results) return []
  return json.results.map((r: { name: string; country?: string; latitude: number; longitude: number }) => ({
    label: r.country ? `${r.name}, ${r.country}` : r.name,
    lat: r.latitude,
    lon: r.longitude,
  }))
}
