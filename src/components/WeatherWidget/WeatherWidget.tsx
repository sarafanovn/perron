import { useEffect, useState, type FormEvent } from 'react'
import { fetchWeatherByCoords, geocodeCity } from '../../lib/weatherApi'
import { readWeatherCache, writeWeatherCache, isWeatherCacheFresh, type WeatherData } from '../../lib/weatherCache'
import { dayPhaseAt, weatherBackground, weatherIcon, type DayPhase } from '../../lib/weatherBackground'
import './WeatherWidget.css'

type Status = 'loading' | 'ready' | 'needs-city' | 'error'

// Re-evaluate which background gradient applies periodically, so a widget
// left open across a sunrise/sunset transition (or just into the next hour)
// updates without needing a refetch — the phase is derived from wall-clock
// time against today's already-fetched sunrise/sunset, not from the network.
const PHASE_REFRESH_MS = 60 * 1000

function useDayPhase(sunrise: string | undefined, sunset: string | undefined): DayPhase {
  const [phase, setPhase] = useState<DayPhase>('day')

  useEffect(() => {
    if (!sunrise || !sunset) return
    const sunriseDate = new Date(sunrise)
    const sunsetDate = new Date(sunset)

    function update() {
      setPhase(dayPhaseAt(new Date(), sunriseDate, sunsetDate))
    }
    update()
    const id = setInterval(update, PHASE_REFRESH_MS)
    return () => clearInterval(id)
  }, [sunrise, sunset])

  return phase
}

function formatHour(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString([], { hour: 'numeric' })
}

function formatWeekday(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString([], { weekday: 'short' })
}

// Standard WHO UV index bands, same ones iOS Weather uses — the raw number
// alone ("6") isn't meaningful to most people without this label.
function uvIndexLabel(uvIndex: number): string {
  if (uvIndex < 3) return 'Low'
  if (uvIndex < 6) return 'Moderate'
  if (uvIndex < 8) return 'High'
  if (uvIndex < 11) return 'Very High'
  return 'Extreme'
}

export function WeatherWidget({
  colSpan = 2,
  rowSpan = 2,
  dynamicBackground = true,
}: {
  colSpan?: number
  rowSpan?: number
  dynamicBackground?: boolean
}) {
  const [status, setStatus] = useState<Status>('loading')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<Array<{ label: string; lat: number; lon: number }>>([])

  const today = weather?.daily[0]
  const phase = useDayPhase(today?.sunrise, today?.sunset)

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
    return <div className="weather-widget weather-widget-plain">Loading weather…</div>
  }

  if (status === 'error') {
    return (
      <div className="weather-widget weather-widget-plain">
        <span>Couldn't load weather.</span>
        <button onClick={() => setStatus('needs-city')}>Try again</button>
      </div>
    )
  }

  if (status === 'needs-city') {
    return (
      <div className="weather-widget weather-widget-plain">
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

  const data = weather!
  const showHourly = colSpan >= 4
  const showDaily = colSpan >= 4 && rowSpan >= 4
  // Only the largest preset (4x4) has enough vertical room for a third
  // section — otherwise it would squeeze the hourly/daily forecasts.
  const showDetails = colSpan >= 4 && rowSpan >= 4

  return (
    <div
      className={`weather-widget${dynamicBackground ? '' : ' weather-widget-static'}`}
      style={dynamicBackground ? { background: weatherBackground(data.weatherCode, phase) } : undefined}
    >
      <div className="weather-current">
        <div className="weather-current-main">
          <span className="weather-icon">{weatherIcon(data.weatherCode, data.isDay)}</span>
          <span className="temp">{Math.round(data.temperatureC)}°</span>
        </div>
        <div className="weather-current-details">
          {locationLabel && <span className="weather-location">{locationLabel}</span>}
          <span className="weather-feels-like">Feels like {Math.round(data.feelsLikeC)}°</span>
        </div>
      </div>

      {showHourly && (
        <div className="weather-hourly">
          {data.hourly.slice(0, 6).map((h) => (
            <div key={h.time} className="weather-hourly-point">
              <span className="weather-hourly-hour">{formatHour(h.time)}</span>
              <span className="weather-hourly-icon">{weatherIcon(h.weatherCode, data.isDay)}</span>
              <span className="weather-hourly-temp">{Math.round(h.temperatureC)}°</span>
            </div>
          ))}
        </div>
      )}

      {showDaily && (
        <div className="weather-daily">
          {data.daily.map((d) => (
            <div key={d.date} className="weather-daily-row">
              <span className="weather-daily-day">{formatWeekday(d.date)}</span>
              <span className="weather-daily-icon">{weatherIcon(d.weatherCode, true)}</span>
              <span className="weather-daily-min">{Math.round(d.tempMinC)}°</span>
              <span className="weather-daily-max">{Math.round(d.tempMaxC)}°</span>
            </div>
          ))}
        </div>
      )}

      {showDetails && (
        <div className="weather-details">
          <div className="weather-detail-card">
            <span className="weather-detail-label">Humidity</span>
            <span className="weather-detail-value">{Math.round(data.humidityPercent)}%</span>
          </div>
          <div className="weather-detail-card">
            <span className="weather-detail-label">Wind</span>
            <span className="weather-detail-value">{Math.round(data.windKph)} km/h</span>
          </div>
          <div className="weather-detail-card">
            <span className="weather-detail-label">UV Index</span>
            <span className="weather-detail-value">{Math.round(data.uvIndex)}</span>
            <span className="weather-detail-sublabel">{uvIndexLabel(data.uvIndex)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
