import type { WeatherData } from './weatherCache'

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather request failed: ${res.status}`)
  const json = await res.json()
  return {
    temperatureC: json.current.temperature_2m,
    windKph: json.current.wind_speed_10m,
    weatherCode: json.current.weather_code,
    locationLabel: '',
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
