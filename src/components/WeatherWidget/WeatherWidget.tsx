import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchWeatherByCoords, geocodeCity, WeatherRequestError } from '../../lib/weatherApi'
import { readWeatherCache, writeWeatherCache, isWeatherCacheFresh, type WeatherData } from '../../lib/weatherCache'
import { dayPhaseAt, weatherBackground, weatherIcon, type DayPhase } from '../../lib/weatherBackground'
import type { WeatherLocation } from '../../lib/types'
import './WeatherWidget.css'

type Status = 'loading' | 'ready' | 'needs-city' | 'error'

// Re-evaluate which background gradient applies periodically, so a widget
// left open across a sunrise/sunset transition (or just into the next hour)
// updates without needing a refetch — the phase is derived from wall-clock
// time against today's already-fetched sunrise/sunset, not from the network.
const PHASE_REFRESH_MS = 60 * 1000

const GEOLOCATION_TIMEOUT_MS = 10 * 1000
// A position fix from the last half hour is close enough for weather and
// returns instantly instead of waiting on GPS/Wi-Fi positioning again.
const GEOLOCATION_MAX_AGE_MS = 30 * 60 * 1000

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
  // A bare "YYYY-MM-DD" parses as UTC midnight, which is the previous
  // day west of Greenwich; parse it as local midnight instead.
  return new Date(`${isoDate}T00:00`).toLocaleDateString([], { weekday: 'short' })
}

// Whether a forecast hour falls between that day's sunrise and sunset —
// using the *current* is_day for every hour drew a sun on night hours (and
// a moon on day ones). Open-Meteo's local ISO times compare as strings.
function isDaytime(isoTime: string, data: WeatherData): boolean {
  const day = data.daily.find((d) => d.date === isoTime.slice(0, 10))
  if (!day) return data.isDay
  return isoTime >= day.sunrise && isoTime < day.sunset
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
  location,
  onLocationChange,
}: {
  colSpan?: number
  rowSpan?: number
  dynamicBackground?: boolean
  location: WeatherLocation | null
  onLocationChange: (location: WeatherLocation | null) => void
}) {
  const [status, setStatus] = useState<Status>('loading')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<Array<{ name: string; label: string; lat: number; lon: number }>>([])
  const [noCityResults, setNoCityResults] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Set only when geolocation itself failed (denied/unavailable), not when a
  // city search afterwards fails — distinguishes "we didn't get your
  // location" from "we don't have a location yet" in the needs-city state.
  const [locationDenied, setLocationDenied] = useState(false)
  // Bumped by every load, so a slow response (or geolocation callback) for a
  // location the user has since changed can't overwrite the newer one.
  const loadIdRef = useRef(0)

  const today = weather?.daily[0]
  const phase = useDayPhase(today?.sunrise, today?.sunset)

  function showWeather(data: WeatherData, label: string) {
    setWeather(data)
    setLocationLabel(label)
    setStatus('ready')
  }

  async function loadForCoords(lat: number, lon: number, label: string) {
    const loadId = ++loadIdRef.current
    const cached = readWeatherCache()
    const cacheMatches = cached !== null && cached.lat === lat && cached.lon === lon
    if (cacheMatches) {
      showWeather(cached.data, label || cached.data.locationLabel)
      if (isWeatherCacheFresh(cached, Date.now())) return
    } else {
      // Keep already-visible weather on screen during a background refresh.
      setStatus((s) => (s === 'ready' ? s : 'loading'))
    }
    try {
      const data = await fetchWeatherByCoords(lat, lon)
      if (loadId !== loadIdRef.current) return
      const withLabel = { ...data, locationLabel: label }
      writeWeatherCache({ lat, lon, fetchedAt: Date.now(), data: withLabel })
      showWeather(withLabel, label)
    } catch (err) {
      if (loadId !== loadIdRef.current) return
      // Stale-but-correct weather for this exact place beats an error.
      if (cacheMatches) return
      setErrorMessage(err instanceof WeatherRequestError ? err.message : "Couldn't load weather.")
      setStatus('error')
    }
  }

  function locate() {
    const loadId = ++loadIdRef.current
    // The last geolocated weather (cached with no label, unlike a picked
    // city) is shown right away: a position fix can take seconds, and a
    // permission prompt the user ignores never answers at all.
    const cached = readWeatherCache()
    const showingCached = cached !== null && !cached.data.locationLabel
    if (showingCached) showWeather(cached.data, '')
    else setStatus('loading')

    if (!navigator.geolocation) {
      setLocationDenied(false)
      setStatus('needs-city')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (loadId !== loadIdRef.current) return
        loadForCoords(pos.coords.latitude, pos.coords.longitude, '')
      },
      (geoErr) => {
        if (loadId !== loadIdRef.current || showingCached) return
        // code 1 = PERMISSION_DENIED; anything else (unavailable/timeout) is
        // not a user refusal, so don't tell them access was denied.
        setLocationDenied(geoErr.code === 1)
        setStatus('needs-city')
      },
      // Without a timeout, an unanswered permission prompt left the widget
      // on "Loading weather…" forever.
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: GEOLOCATION_MAX_AGE_MS }
    )
  }

  function reload() {
    if (location) loadForCoords(location.lat, location.lon, location.label)
    else locate()
  }

  const locationKey = location ? `${location.lat},${location.lon}` : 'auto'
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey])

  function openCityPicker() {
    setCityQuery('')
    setCityResults([])
    setNoCityResults(false)
    setLocationDenied(false)
    setStatus('needs-city')
  }

  function chooseCity(city: WeatherLocation) {
    setCityResults([])
    if (location && city.lat === location.lat && city.lon === location.lon) {
      loadForCoords(city.lat, city.lon, city.label)
      return
    }
    onLocationChange(city)
  }

  function handleUseMyLocation() {
    if (location) onLocationChange(null)
    else locate()
  }

  async function handleCitySubmit(e: FormEvent) {
    e.preventDefault()
    if (!cityQuery.trim()) return
    try {
      const results = await geocodeCity(cityQuery.trim())
      setCityResults(results)
      setNoCityResults(results.length === 0)
    } catch (err) {
      setErrorMessage(err instanceof WeatherRequestError ? err.message : "Couldn't search for that city.")
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return <div className="weather-widget weather-widget-plain">Loading weather…</div>
  }

  if (status === 'error') {
    return (
      <div className="weather-widget weather-widget-plain">
        <span>{errorMessage ?? "Couldn't load weather."}</span>
        <div className="weather-actions">
          <button type="button" onClick={reload}>Try again</button>
          <button type="button" onClick={openCityPicker}>Choose city</button>
        </div>
      </div>
    )
  }

  if (status === 'needs-city') {
    return (
      <div className="weather-widget weather-widget-plain">
        {locationDenied && (
          <span className="weather-location-denied">
            Location access was denied. Search for a city instead.
          </span>
        )}
        <form onSubmit={handleCitySubmit}>
          <input
            placeholder="City…"
            aria-label="City"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value)
              setNoCityResults(false)
            }}
          />
        </form>
        {noCityResults && <span className="weather-location-denied">No cities found.</span>}
        {cityResults.map((r) => (
          <button
            type="button"
            key={`${r.lat},${r.lon}`}
            className="city-option"
            // Only the city's own name is shown on the widget itself — the
            // region/country just disambiguate the list.
            onClick={() => chooseCity({ lat: r.lat, lon: r.lon, label: r.name })}
          >
            {r.label}
          </button>
        ))}
        <div className="weather-actions">
          {navigator.geolocation && (
            <button type="button" onClick={handleUseMyLocation}>
              Use my location
            </button>
          )}
          {weather && (
            <button type="button" onClick={() => setStatus('ready')}>
              Cancel
            </button>
          )}
        </div>
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
      className={`weather-widget${dynamicBackground ? '' : ' weather-widget-static'}${colSpan < 4 ? ' weather-widget-small' : ''}`}
      style={dynamicBackground ? { background: weatherBackground(data.weatherCode, phase) } : undefined}
    >
      <div className="weather-current">
        <div className="weather-current-main">
          <span className="weather-icon">{weatherIcon(data.weatherCode, data.isDay)}</span>
          <span className="temp">{Math.round(data.temperatureC)}°</span>
        </div>
        <div className="weather-current-details">
          <button type="button" className="weather-location" title="Change location" onClick={openCityPicker}>
            {locationLabel || 'My location'}
          </button>
          <span className="weather-feels-like">Feels like {Math.round(data.feelsLikeC)}°</span>
        </div>
      </div>

      {showHourly && (
        <div className="weather-hourly">
          {data.hourly.slice(0, 6).map((h) => (
            <div key={h.time} className="weather-hourly-point">
              <span className="weather-hourly-hour">{formatHour(h.time)}</span>
              <span className="weather-hourly-icon">{weatherIcon(h.weatherCode, isDaytime(h.time, data))}</span>
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
            <span className="weather-detail-label">UV</span>
            <span className="weather-detail-value">{Math.round(data.uvIndex)}</span>
            <span className="weather-detail-sublabel">{uvIndexLabel(data.uvIndex)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
