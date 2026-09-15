import { useEffect, useState, type FormEvent } from 'react'
import { fetchWeatherByCoords, geocodeCity } from '../../lib/weatherApi'
import { readWeatherCache, writeWeatherCache, isWeatherCacheFresh, type WeatherData } from '../../lib/weatherCache'
import './WeatherWidget.css'

type Status = 'loading' | 'ready' | 'needs-city' | 'error'

export function WeatherWidget() {
  const [status, setStatus] = useState<Status>('loading')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<Array<{ label: string; lat: number; lon: number }>>([])

  async function loadForCoords(lat: number, lon: number, label: string) {
    setStatus('loading')
    try {
      const cached = readWeatherCache()
      if (cached && cached.lat === lat && cached.lon === lon && isWeatherCacheFresh(cached, Date.now())) {
        setWeather(cached.data)
        setLocationLabel(label || cached.data.locationLabel)
        setStatus('ready')
        return
      }
      const data = await fetchWeatherByCoords(lat, lon)
      const withLabel = { ...data, locationLabel: label }
      writeWeatherCache({ lat, lon, fetchedAt: Date.now(), data: withLabel })
      setWeather(withLabel)
      setLocationLabel(label)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('needs-city')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadForCoords(pos.coords.latitude, pos.coords.longitude, ''),
      () => setStatus('needs-city')
    )
  }, [])

  async function handleCitySubmit(e: FormEvent) {
    e.preventDefault()
    if (!cityQuery.trim()) return
    try {
      const results = await geocodeCity(cityQuery.trim())
      setCityResults(results)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return <div className="weather-widget">Loading weather…</div>
  }

  if (status === 'error') {
    return (
      <div className="weather-widget">
        <span>Couldn't load weather.</span>
        <button onClick={() => setStatus('needs-city')}>Try again</button>
      </div>
    )
  }

  if (status === 'needs-city') {
    return (
      <div className="weather-widget">
        <form onSubmit={handleCitySubmit}>
          <input
            placeholder="Search city"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
          />
        </form>
        {cityResults.map((r) => (
          <div
            key={`${r.lat},${r.lon}`}
            className="city-option"
            onClick={() => loadForCoords(r.lat, r.lon, r.label)}
          >
            {r.label}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="weather-widget">
      <span className="temp">{Math.round(weather!.temperatureC)}°C</span>
      <span>{locationLabel}</span>
      <span>{Math.round(weather!.windKph)} km/h wind</span>
    </div>
  )
}
