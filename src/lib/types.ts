export type SearchEngineId = 'google' | 'duckduckgo' | 'bing' | 'yandex'
// Built-in widgets keep fixed ids; each shortcut is its own widget with
// id `shortcut:<Shortcut.id>` so it can be positioned and dragged
// independently in the grid.
export type WidgetId = 'search' | 'weather' | (string & {})
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

export interface GridSettings {
  columns: number
  rows: number
}

export interface Settings {
  version: 1
  theme: ThemeSettings
  search: { engine: SearchEngineId }
  shortcuts: Shortcut[]
  widgetLayout: WidgetLayoutEntry[]
  grid: GridSettings
}
