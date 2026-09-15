export type SearchEngineId = 'google' | 'duckduckgo' | 'bing' | 'yandex'
export type WidgetId = 'search' | 'weather' | 'shortcuts'
export type BackgroundType = 'gradient' | 'solid' | 'image'

export interface BackgroundSettings {
  type: BackgroundType
  value: string
}

export interface ThemeSettings {
  accentColor: string
  background: BackgroundSettings
  font: string
}

export interface Shortcut {
  id: string
  label: string
  url: string
  iconUrl?: string
}

export interface WidgetLayoutEntry {
  widgetId: WidgetId
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export interface Settings {
  version: 1
  theme: ThemeSettings
  search: { engine: SearchEngineId }
  shortcuts: Shortcut[]
  widgetLayout: WidgetLayoutEntry[]
}
