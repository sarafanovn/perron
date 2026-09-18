export type SearchEngineId = 'google' | 'duckduckgo' | 'bing' | 'yandex'
// Built-in widgets keep fixed ids; each shortcut is its own widget with
// id `shortcut:<Shortcut.id>` so it can be positioned and dragged
// independently in the grid.
export type WidgetId = 'search' | 'weather' | (string & {})
export type BackgroundType = 'gradient' | 'solid' | 'image' | 'animated'

export interface BackgroundSettings {
  type: BackgroundType
  // For type 'animated', this holds JSON.stringify(AnimatedBackgroundSettings)
  // instead of a CSS value — reusing this field keeps BackgroundSettings a
  // single-value shape instead of a union with type-specific fields, since
  // only one background type is ever active at a time anyway.
  value: string
}

// Backed by the Vanta.js FOG effect (see AnimatedBackground.tsx), which
// takes exactly 4 named color slots rather than an arbitrary-length
// palette — base is the backdrop the other three blend over.
export interface AnimatedBackgroundSettings {
  baseColor: string
  lowlightColor: string
  midtoneColor: string
  highlightColor: string
  // 0-100. How fast the fog drifts over time.
  speed: number
  // 0-100. Spatial zoom of the noise field: low values read as a few large
  // soft regions, high values as many small intricate ones.
  zoom: number
  // 0-100. Vanta's blurFactor — how much the color bands bleed into each
  // other; 0 is the softest, widest bleed, 100 is the most separated.
  blurFactor: number
}

export type ThemeMode = 'light' | 'dark' | 'auto'

// 'plain' renders every surface (widgets, panels, FAB) as an opaque flat
// fill with no blur; 'glass' renders them as translucent frosted-glass
// surfaces (blur + light refraction where supported).
export type ThemeStyle = 'plain' | 'glass'

export interface ThemeSettings {
  accentColor: string
  background: BackgroundSettings
  font: string
  mode: ThemeMode
  style: ThemeStyle
}

export interface Shortcut {
  id: string
  label: string
  url: string
  iconUrl?: string
}

export interface Note {
  id: string
  text: string
}

export interface Translator {
  id: string
  sourceLang: string
  targetLang: string
  sourceText: string
  translatedText: string
}

export type ClockStyle = 'digital' | 'analog'
export type ClockTimeFormat = '12h' | '24h'

export interface Clock {
  id: string
  style: ClockStyle
  // Digital face only — analog has no numeric readout to format.
  timeFormat: ClockTimeFormat
  // Digital face only.
  showDate: boolean
  // true (default): paints --color-surface like every other widget.
  // false: fully transparent, so only the time/date/hands float over the
  // page background — for a more minimal, "always-on-display" look.
  showBackground: boolean
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

export interface WeatherSettings {
  // true (default): the widget paints its own time/condition-based gradient.
  // false: it renders as a plain surface like every other widget
  // (--color-surface), for users who want visual consistency over the
  // weather-driven color.
  dynamicBackground: boolean
}

export interface Settings {
  version: 1
  theme: ThemeSettings
  search: { engine: SearchEngineId }
  weather: WeatherSettings
  shortcuts: Shortcut[]
  notes: Note[]
  translators: Translator[]
  clocks: Clock[]
  widgetLayout: WidgetLayoutEntry[]
  grid: GridSettings
}
