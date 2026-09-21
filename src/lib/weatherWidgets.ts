import type { WidgetId } from './types'

const WEATHER_PREFIX = 'weather:'

export function widgetIdForWeather(weatherId: string): WidgetId {
  return `${WEATHER_PREFIX}${weatherId}`
}

export function isWeatherWidgetId(widgetId: WidgetId): boolean {
  return widgetId === 'weather' || widgetId.startsWith(WEATHER_PREFIX)
}
